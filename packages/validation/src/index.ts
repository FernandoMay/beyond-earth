import { z } from 'zod';

const currencySchema = z.enum(['USD', 'USDC', 'EUR']);
const verticalSchema = z.enum(['aviation', 'space', 'manufacturing', 'drones', 'marketplace']);
const digestSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/i, 'Expected a 64-character SHA-256 hex digest');

export const stellarAddressSchema = z
  .string()
  .regex(/^G[A-Z2-7]{55}$/, 'Expected a Stellar account address (G…)');

export const assetIdSchema = z.string().min(3).max(64);
export const walletAddressSchema = stellarAddressSchema.or(
  z.string().regex(/^DEMO[-_][A-Za-z0-9_-]+$/, 'Expected a Stellar address or DEMO identifier'),
);

export const moneySchema = z.object({
  amount: z.number().finite().nonnegative(),
  currency: currencySchema,
});

export const assetQuerySchema = z.object({
  vertical: verticalSchema.optional(),
  status: z
    .enum(['draft', 'evidence_review', 'verified', 'tokenized', 'active', 'suspended', 'retired'])
    .optional(),
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  offset: z.coerce.number().int().min(0).default(0),
});

export const subscriptionRequestSchema = z.object({
  offeringId: z.string().min(3).max(64),
  wallet: walletAddressSchema,
  amount: moneySchema.refine((value) => value.amount > 0, 'Amount must be positive'),
  idempotencyKey: z.string().min(8).max(128),
  acknowledgement: z.literal(true, {
    errorMap: () => ({ message: 'Investor acknowledgement is required' }),
  }),
});

export const assetDraftSchema = z.object({
  name: z.string().trim().min(3).max(120),
  shortName: z.string().trim().min(2).max(60).optional(),
  vertical: verticalSchema.exclude(['marketplace']),
  category: z.enum([
    'aircraft',
    'engine',
    'satellite',
    'orbital-infrastructure',
    'tooling',
    'component',
    'inventory',
    'drone-fleet',
    'service-contract',
  ]),
  jurisdiction: z.string().trim().min(2).max(120),
  operator: z.string().trim().min(2).max(120),
  ownerEntity: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(20).max(400),
  valuation: moneySchema,
  documentDigests: z.array(digestSchema).min(1).max(20),
  acknowledgement: z.literal(true),
});

export const offeringDraftSchema = z
  .object({
    assetId: assetIdSchema,
    targetRaise: moneySchema,
    minTicket: moneySchema,
    opensAt: z.coerce.date(),
    closesAt: z.coerce.date(),
    distributionFrequency: z.enum(['monthly', 'quarterly', 'semi-annual']),
    eligibility: z.string().trim().min(10).max(240),
  })
  .refine((value) => value.closesAt > value.opensAt, {
    message: 'Closing date must be after opening date',
    path: ['closesAt'],
  })
  .refine((value) => value.minTicket.amount <= value.targetRaise.amount, {
    message: 'Minimum ticket cannot exceed the target raise',
    path: ['minTicket'],
  });

export const valuationInputSchema = z.object({
  assetId: assetIdSchema,
  annualCashFlow: z.number().finite().nonnegative(),
  discountRatePct: z.number().finite().min(0).max(100),
  terminalValue: z.number().finite().nonnegative().default(0),
  years: z.number().int().min(1).max(50),
  maintenanceHaircutPct: z.number().finite().min(0).max(100).default(0),
  liquidityHaircutPct: z.number().finite().min(0).max(100).default(0),
  methodology: z.string().trim().min(3).max(200),
  asOf: z.coerce.date(),
});

export const documentManifestSchema = z.object({
  assetId: assetIdSchema,
  version: z.string().trim().min(1).max(40),
  files: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        digest: digestSchema,
        mediaType: z.string().trim().min(3).max(120),
        ipfsCid: z.string().trim().min(10).max(200).optional(),
      }),
    )
    .min(1)
    .max(100),
  issuedAt: z.coerce.date(),
  issuer: z.string().trim().min(2).max(120),
});

export const complianceDecisionSchema = z.object({
  caseId: z.string().min(3).max(64),
  decision: z.enum(['approve', 'reject', 'request_information']),
  tier: z.number().int().min(0).max(4).optional(),
  expiresAt: z.coerce.date().optional(),
  reason: z.string().trim().min(5).max(500),
  reviewer: z.string().trim().min(2).max(120),
});

export const webhookEventSchema = z.object({
  id: z.string().min(1).max(128),
  type: z.enum([
    'asset.registered',
    'asset.verified',
    'investment.subscribed',
    'investment.settled',
    'distribution.published',
    'distribution.claimed',
    'lease.payment',
  ]),
  ledger: z.number().int().nonnegative(),
  occurredAt: z.coerce.date(),
  payload: z.record(z.unknown()),
});

export type AssetQuery = z.infer<typeof assetQuerySchema>;
export type SubscriptionRequest = z.infer<typeof subscriptionRequestSchema>;
export type AssetDraft = z.infer<typeof assetDraftSchema>;
export type OfferingDraft = z.infer<typeof offeringDraftSchema>;
export type ValuationInput = z.infer<typeof valuationInputSchema>;
export type DocumentManifest = z.infer<typeof documentManifestSchema>;
export type ComplianceDecision = z.infer<typeof complianceDecisionSchema>;
export type WebhookEvent = z.infer<typeof webhookEventSchema>;
