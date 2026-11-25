import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../src/server';
import { InMemoryRepository } from '../src/repository';

const API_KEY = 'test-api-key-value';

let app: FastifyInstance | undefined;

async function createApp(options: { demoMode?: boolean; apiKey?: string } = {}) {
  app = await buildServer({
    repository: new InMemoryRepository(),
    demoMode: options.demoMode ?? true,
    apiKey: options.apiKey,
  });
  return app;
}

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('health and read routes', () => {
  it('reports service metadata in demo mode', async () => {
    const server = await createApp();
    const response = await server.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ok',
      service: 'aerospace-rwa-api',
      mode: 'demo',
      repository: 'demo',
      network: 'testnet',
    });
  });

  it('returns the demo snapshot with illustrative records only', async () => {
    const server = await createApp();
    const response = await server.inject({ method: 'GET', url: '/v1/snapshot' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.assets.length).toBeGreaterThan(0);
    expect(body.assets.every((asset: { illustrative: boolean }) => asset.illustrative)).toBe(true);
  });

  it('filters assets by vertical and text query', async () => {
    const server = await createApp();
    const response = await server.inject({
      method: 'GET',
      url: '/v1/assets?vertical=aviation&q=engine',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.total).toBeGreaterThan(0);
    expect(body.limit).toBe(24);
    expect(body.offset).toBe(0);
    expect(body.items.every((asset: { vertical: string }) => asset.vertical === 'aviation')).toBe(
      true,
    );
  });

  it('rejects invalid asset query parameters', async () => {
    const server = await createApp();
    const response = await server.inject({ method: 'GET', url: '/v1/assets?vertical=maritime' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns an asset by slug and 404s an unknown asset', async () => {
    const server = await createApp();
    const found = await server.inject({
      method: 'GET',
      url: '/v1/assets/reference-turbofan-engine-lease',
    });
    expect(found.statusCode).toBe(200);
    expect(found.json().slug).toBe('reference-turbofan-engine-lease');

    const missing = await server.inject({ method: 'GET', url: '/v1/assets/not-a-real-asset' });
    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toMatchObject({ code: 'ASSET_NOT_FOUND' });
  });

  it('returns 404 with a request id for unknown routes', async () => {
    const server = await createApp();
    const response = await server.inject({ method: 'GET', url: '/v1/nope' });
    expect(response.statusCode).toBe(404);
    expect(response.json().code).toBe('ROUTE_NOT_FOUND');
    expect(response.json().requestId).toBeTruthy();
  });
});

describe('write guards', () => {
  it('blocks subscriptions in demo mode without creating a record', async () => {
    const repository = new InMemoryRepository();
    app = await buildServer({ repository, demoMode: true });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/subscriptions',
      payload: {
        offeringId: 'offering_demo_1',
        wallet: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
        amount: { amount: 25_000, currency: 'USDC' },
        idempotencyKey: 'idem-demo-0001',
        acknowledgement: true,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ mode: 'demo', accepted: false, code: 'DEMO_MODE' });
    expect(await repository.findSubscriptionByIdempotencyKey('idem-demo-0001')).toBeNull();
  });

  it('rejects subscriptions without acknowledgement before any side effect', async () => {
    const server = await createApp({ demoMode: true });
    const response = await server.inject({
      method: 'POST',
      url: '/v1/subscriptions',
      payload: {
        offeringId: 'offering_demo_1',
        wallet: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
        amount: { amount: 25_000, currency: 'USDC' },
        idempotencyKey: 'idem-demo-0002',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe('VALIDATION_ERROR');
  });

  it('blocks compliance decisions in demo mode', async () => {
    const server = await createApp({ demoMode: true });
    const response = await server.inject({
      method: 'POST',
      url: '/v1/compliance/decisions',
      payload: {
        caseId: 'case_001',
        decision: 'approve',
        reason: 'All documents reviewed and accepted.',
        reviewer: 'demo-reviewer',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().code).toBe('DEMO_MODE');
  });

  it('requires an API key for writes in live mode', async () => {
    const server = await createApp({ demoMode: false, apiKey: API_KEY });
    const response = await server.inject({
      method: 'POST',
      url: '/v1/assets',
      payload: sampleDraft(),
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe('UNAUTHORIZED');
  });

  it('refuses writes when no API key is configured', async () => {
    const server = await createApp({ demoMode: false });
    const response = await server.inject({
      method: 'POST',
      url: '/v1/assets',
      headers: { 'x-api-key': API_KEY },
      payload: sampleDraft(),
    });

    expect(response.statusCode).toBe(503);
    expect(response.json().code).toBe('NOT_CONFIGURED');
  });
});

describe('live-mode writes', () => {
  it('creates an illustrative draft asset with a valid API key', async () => {
    const server = await createApp({ demoMode: false, apiKey: API_KEY });
    const response = await server.inject({
      method: 'POST',
      url: '/v1/assets',
      headers: { 'x-api-key': API_KEY, 'x-actor': 'issuer-test' },
      payload: sampleDraft(),
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.mode).toBe('live');
    expect(body.asset).toMatchObject({
      status: 'draft',
      illustrative: true,
      vertical: 'aviation',
      name: 'Test Engine Structure',
    });
  });

  it('creates and replays a subscription idempotently', async () => {
    const server = await createApp({ demoMode: false, apiKey: API_KEY });
    const payload = {
      offeringId: 'offering_demo_1',
      wallet: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      amount: { amount: 25_000, currency: 'USDC' },
      idempotencyKey: 'idem-live-0001',
      acknowledgement: true,
    };

    const first = await server.inject({
      method: 'POST',
      url: '/v1/subscriptions',
      headers: { 'x-api-key': API_KEY },
      payload,
    });
    expect(first.statusCode).toBe(201);
    expect(first.json()).toMatchObject({ mode: 'live', accepted: true, status: 'pending_escrow' });

    const second = await server.inject({
      method: 'POST',
      url: '/v1/subscriptions',
      headers: { 'x-api-key': API_KEY },
      payload,
    });
    expect(second.statusCode).toBe(200);
    expect(second.json()).toMatchObject({
      idempotentReplay: true,
      subscriptionId: first.json().subscriptionId,
    });
  });

  it('returns 404 when deciding an unknown compliance case', async () => {
    const server = await createApp({ demoMode: false, apiKey: API_KEY });
    const response = await server.inject({
      method: 'POST',
      url: '/v1/compliance/decisions',
      headers: { 'x-api-key': API_KEY },
      payload: {
        caseId: 'case_missing',
        decision: 'request_information',
        reason: 'Need updated beneficial ownership evidence.',
        reviewer: 'reviewer-test',
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().code).toBe('CASE_NOT_FOUND');
  });
});

function sampleDraft() {
  return {
    name: 'Test Engine Structure',
    vertical: 'aviation',
    category: 'engine',
    jurisdiction: 'Ireland',
    operator: 'Test Operator',
    ownerEntity: 'Test Owner Ltd',
    summary: 'Illustrative draft created by the automated test suite only.',
    valuation: { amount: 1_000_000, currency: 'USD' },
    documentDigests: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
    acknowledgement: true,
  };
}
