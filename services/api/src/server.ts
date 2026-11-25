import { timingSafeEqual } from 'node:crypto';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import {
  assetDraftSchema,
  assetQuerySchema,
  complianceDecisionSchema,
  subscriptionRequestSchema,
} from '@aerospace/validation';
import { DEMO_SUBSCRIPTION_MESSAGE, VERSION } from './constants';
import {
  fetchStellarAccount,
  fetchStellarTransaction,
  isValidAccountAddress,
  isValidContractAddress,
  readSorobanContract,
} from '@aerospace/stellar-sdk';
import type { AerospaceRepository } from './repository';
import { z } from 'zod';
import { Keypair } from '@stellar/stellar-sdk';
import { randomBytes } from 'node:crypto';

export interface ServerOptions {
  repository: AerospaceRepository;
  demoMode?: boolean;
  apiKey?: string;
  logger?: boolean;
  corsOrigins?: string[];
}

class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function requireApiKey(request: FastifyRequest, apiKey: string | undefined, demoMode: boolean) {
  if (demoMode) {
    throw new HttpError(
      409,
      'DEMO_MODE',
      'Write operations are disabled in demo mode. Configure a non-demo API and API_KEY to exercise them.',
    );
  }
  if (!apiKey) {
    throw new HttpError(503, 'NOT_CONFIGURED', 'Write API is not configured with an API key.');
  }
  const provided = request.headers['x-api-key'];
  if (typeof provided !== 'string' || !safeEqual(provided, apiKey)) {
    throw new HttpError(401, 'UNAUTHORIZED', 'A valid x-api-key header is required.');
  }
}

export async function buildServer(options: ServerOptions): Promise<FastifyInstance> {
  const demoMode = options.demoMode ?? true;
  const challenges = new Map<string, { nonce: string; expires: number }>();
  const sessions = new Map<string, { wallet: string; expires: number }>();
  const adminWallets = (process.env.ADMIN_WALLETS ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);


  function sessionWallet(request: FastifyRequest): string | null {
    const auth = request.headers.authorization;
    const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    if (!token) return null;
    const session = sessions.get(token);
    if (!session || session.expires < Date.now()) return null;
    return session.wallet;
  }

  function hasRole(wallet: string, role: string): boolean {
    if (role === 'admin') return adminWallets.includes(wallet);
    return false;
  }

  const allowedOrigins = options.corsOrigins ?? [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
  ];
  const app = Fastify({
    logger: options.logger ?? false,
    bodyLimit: 256 * 1024,
    disableRequestLogging: true,
    trustProxy: false,
  });

  let requestsTotal = 0;
  let errorsTotal = 0;
  const startedAt = Date.now();

  app.addHook('onRequest', async (request, reply) => {
    reply.header('x-content-type-options', 'nosniff');
    reply.header('cache-control', 'no-store');
    const origin = request.headers.origin;
    if (typeof origin === 'string' && allowedOrigins.includes(origin)) {
      reply.header('access-control-allow-origin', origin);
      reply.header('vary', 'origin');
    }
    if (request.method === 'OPTIONS') {
      reply
        .header('access-control-allow-methods', 'GET, POST, OPTIONS')
        .header('access-control-allow-headers', 'content-type, x-api-key, idempotency-key, x-actor')
        .code(204)
        .send();
    }
  });

  app.addHook('onResponse', async (request, reply) => {
    requestsTotal += 1;
    if (reply.statusCode >= 500) errorsTotal += 1;
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      void reply.code(400).send({
        error: 'Request validation failed',
        code: 'VALIDATION_ERROR',
        requestId: request.id,
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }
    if (error instanceof HttpError) {
      void reply
        .code(error.statusCode)
        .send({ error: error.message, code: error.code, requestId: request.id });
      return;
    }
    request.log.error(error);
    void reply.code(500).send({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      requestId: request.id,
    });
  });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'aerospace-rwa-api',
    version: VERSION,
    mode: demoMode ? 'demo' : 'live',
    repository: options.repository.kind,
    network: 'testnet',
    timestamp: new Date().toISOString(),
  }));

  app.get('/metrics', async (_request, reply) => {
    const uptime = (Date.now() - startedAt) / 1000;
    const body = [
      '# HELP aerospace_api_requests_total Total HTTP requests handled.',
      '# TYPE aerospace_api_requests_total counter',
      `aerospace_api_requests_total ${requestsTotal}`,
      '# HELP aerospace_api_errors_total Total HTTP 5xx responses.',
      '# TYPE aerospace_api_errors_total counter',
      `aerospace_api_errors_total ${errorsTotal}`,
      '# HELP aerospace_api_uptime_seconds Process uptime since server build.',
      '# TYPE aerospace_api_uptime_seconds gauge',
      `aerospace_api_uptime_seconds ${uptime.toFixed(3)}`,
      '# HELP aerospace_api_demo_mode Whether the API runs in demo mode (1) or live mode (0).',
      '# TYPE aerospace_api_demo_mode gauge',
      `aerospace_api_demo_mode ${demoMode ? 1 : 0}`,
      '',
    ].join('\n');
    return reply.header('content-type', 'text/plain; version=0.0.4').send(body);
  });

  app.get('/v1/snapshot', async () => options.repository.getSnapshot());

  app.get('/v1/assets', async (request) => {
    const query = assetQuerySchema.parse(request.query);
    const result = await options.repository.listAssets(query);
    return { ...result, limit: query.limit, offset: query.offset };
  });

  app.get<{ Params: { id: string } }>('/v1/assets/:id', async (request, reply) => {
    const asset = await options.repository.getAsset(request.params.id);
    if (!asset) {
      return reply.code(404).send({
        error: 'Asset not found',
        code: 'ASSET_NOT_FOUND',
        requestId: request.id,
      });
    }
    return asset;
  });

  app.post('/v1/assets', async (request, reply) => {
    requireApiKey(request, options.apiKey, demoMode);
    const draft = assetDraftSchema.parse(request.body);
    const actor = String(request.headers['x-actor'] ?? 'api-issuer');
    const asset = await options.repository.createAssetDraft({ ...draft, actor });
    return reply.code(201).send({ mode: 'live', asset });
  });

  app.get('/v1/investor', async (request) => {
    const wallet = (request.query as { wallet?: string } | undefined)?.wallet;
    return options.repository.getInvestor(wallet);
  });

  app.get('/v1/distributions', async () => ({
    items: await options.repository.listDistributions(),
  }));

  app.get('/v1/compliance/cases', async () => ({
    items: await options.repository.listComplianceCases(),
  }));

  app.post('/v1/compliance/decisions', async (request) => {
    requireApiKey(request, options.apiKey, demoMode);
    const decision = complianceDecisionSchema.parse(request.body);
    const updated = await options.repository.decideCompliance(decision);
    if (!updated) {
      throw new HttpError(404, 'CASE_NOT_FOUND', 'Compliance case not found.');
    }
    return { mode: 'live', case: updated };
  });

  app.get('/v1/operations/tasks', async () => ({
    items: await options.repository.listOperationsTasks(),
  }));

  app.post('/v1/subscriptions', async (request, reply) => {
    const parsed = subscriptionRequestSchema.parse(request.body);
    const headerKey = request.headers['idempotency-key'];
    const idempotencyKey =
      typeof headerKey === 'string' && headerKey.length >= 8 ? headerKey : parsed.idempotencyKey;

    if (demoMode) {
      return reply.code(200).send({
        mode: 'demo',
        accepted: false,
        code: 'DEMO_MODE',
        message: DEMO_SUBSCRIPTION_MESSAGE,
      });
    }

    requireApiKey(request, options.apiKey, demoMode);
    const existing = await options.repository.findSubscriptionByIdempotencyKey(idempotencyKey);
    if (existing) {
      return {
        mode: 'live',
        accepted: true,
        subscriptionId: existing.id,
        status: existing.status,
        idempotentReplay: true,
      };
    }
    const record = await options.repository.createSubscription({
      offeringId: parsed.offeringId,
      wallet: parsed.wallet,
      amount: parsed.amount,
      idempotencyKey,
    });
    return reply.code(201).send({
      mode: 'live',
      accepted: true,
      subscriptionId: record.id,
      status: record.status,
    });
  });

  app.get<{ Params: { address: string } }>(
    '/v1/stellar/accounts/:address',
    async (request, reply) => {
      if (!isValidAccountAddress(request.params.address)) {
        throw new HttpError(400, 'INVALID_ADDRESS', 'A valid Stellar account address is required.');
      }
      const account = await fetchStellarAccount(request.params.address);
      return account;
    },
  );

  app.get<{ Params: { hash: string } }>('/v1/stellar/transactions/:hash', async (request) => {
    const transaction = await fetchStellarTransaction(request.params.hash);
    return transaction;
  });

  app.get<{ Params: { contractId: string; method: string } }>(
    '/v1/stellar/soroban/:contractId/:method',
    async (request) => {
      if (!isValidContractAddress(request.params.contractId)) {
        throw new HttpError(
          400,
          'INVALID_CONTRACT',
          'A valid Soroban contract address is required.',
        );
      }
      return readSorobanContract({
        contractId: request.params.contractId,
        method: request.params.method,
      });
    },
  );


  const authChallengeSchema = z.object({ wallet: z.string() });
  const authVerifySchema = z.object({
    wallet: z.string(),
    message: z.string(),
    signature: z.string(),
  });

  app.post('/v1/auth/challenge', async (request, reply) => {
    const parsed = authChallengeSchema.parse(request.body ?? {});
    if (!isValidAccountAddress(parsed.wallet)) {
      throw new HttpError(400, 'INVALID_WALLET', 'A valid Stellar wallet address is required.');
    }
    const nonce = randomBytes(16).toString('hex');
    const message = `Aerospace RWA authentication\nWallet: ${parsed.wallet}\nNonce: ${nonce}`;
    challenges.set(parsed.wallet, { nonce, expires: Date.now() + 5 * 60 * 1000 });
    return reply.code(200).send({ wallet: parsed.wallet, nonce, message });
  });

  app.post('/v1/auth/verify', async (request, reply) => {
    const parsed = authVerifySchema.parse(request.body ?? {});
    if (!isValidAccountAddress(parsed.wallet)) {
      throw new HttpError(400, 'INVALID_WALLET', 'A valid Stellar wallet address is required.');
    }
    const challenge = challenges.get(parsed.wallet);
    if (!challenge || challenge.expires < Date.now()) {
      throw new HttpError(401, 'CHALLENGE_EXPIRED', 'Request a new authentication challenge.');
    }
    const expectedMessage = `Aerospace RWA authentication\nWallet: ${parsed.wallet}\nNonce: ${challenge.nonce}`;
    if (parsed.message !== expectedMessage) {
      throw new HttpError(401, 'INVALID_MESSAGE', 'Authentication message mismatch.');
    }
    let valid = false;
    try {
      const keypair = Keypair.fromPublicKey(parsed.wallet);
      valid = keypair.verify(Buffer.from(parsed.message), Buffer.from(parsed.signature, 'base64'));
    } catch {
      valid = false;
    }
    if (!valid) {
      throw new HttpError(401, 'INVALID_SIGNATURE', 'Wallet signature verification failed.');
    }
    challenges.delete(parsed.wallet);
    const token = randomBytes(32).toString('hex');
    sessions.set(token, { wallet: parsed.wallet, expires: Date.now() + 24 * 60 * 60 * 1000 });
    return reply.code(200).send({ token, wallet: parsed.wallet });
  });

  app.get('/v1/auth/session', async (request, reply) => {
    const auth = request.headers.authorization;
    const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    if (!token) throw new HttpError(401, 'UNAUTHORIZED', 'Bearer token required.');
    const session = sessions.get(token);
    if (!session || session.expires < Date.now()) {
      throw new HttpError(401, 'SESSION_EXPIRED', 'Session is invalid or expired.');
    }
    return { wallet: session.wallet };
  });


  app.get('/v1/auth/me', async (request, reply) => {
    const wallet = sessionWallet(request);
    if (!wallet) throw new HttpError(401, 'UNAUTHORIZED', 'Valid session required.');
    const roles = adminWallets.includes(wallet) ? ['admin'] : ['investor'];
    return reply.code(200).send({ wallet, roles });
  });


  app.get('/v1/offerings', async () => ({ items: await options.repository.listOfferings() }));

  app.post('/v1/offerings', async (request, reply) => {
    requireApiKey(request, options.apiKey, demoMode);
    const offering = request.body as Record<string, unknown>;
    const created = await options.repository.createOffering(offering as never);
    return reply.code(201).send({ mode: demoMode ? 'demo' : 'live', offering: created });
  });

  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) =>
    reply.code(404).send({
      error: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
      requestId: request.id,
    }),
  );

  return app;
}
