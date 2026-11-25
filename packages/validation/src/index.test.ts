import { describe, expect, it } from 'vitest';
import {
  assetDraftSchema,
  offeringDraftSchema,
  stellarAddressSchema,
  subscriptionRequestSchema,
} from '../src';

const digest = 'a'.repeat(64);

describe('validation schemas', () => {
  it('accepts a valid Stellar account address', () => {
    expect(
      stellarAddressSchema.safeParse('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF')
        .success,
    ).toBe(true);
  });

  it('rejects malformed Stellar addresses', () => {
    expect(stellarAddressSchema.safeParse('not-an-address').success).toBe(false);
  });

  it('requires acknowledgement on a subscription', () => {
    const result = subscriptionRequestSchema.safeParse({
      offeringId: 'off_001',
      wallet: 'DEMO-WALLET-01',
      amount: { amount: 25_000, currency: 'USDC' },
      idempotencyKey: 'idem_12345678',
      acknowledgement: false,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a compliant subscription request', () => {
    const result = subscriptionRequestSchema.safeParse({
      offeringId: 'off_001',
      wallet: 'DEMO-WALLET-01',
      amount: { amount: 25_000, currency: 'USDC' },
      idempotencyKey: 'idem_12345678',
      acknowledgement: true,
    });
    expect(result.success).toBe(true);
  });

  it('requires documented evidence in an asset draft', () => {
    const result = assetDraftSchema.safeParse({
      name: 'Test engine',
      vertical: 'aviation',
      category: 'engine',
      jurisdiction: 'Test',
      operator: 'Test operator',
      ownerEntity: 'Test SPV',
      summary: 'A sufficiently long demonstration summary for schema validation.',
      valuation: { amount: 1_000_000, currency: 'USD' },
      documentDigests: [],
      acknowledgement: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an offering with a closing date before opening', () => {
    const result = offeringDraftSchema.safeParse({
      assetId: 'ast_001',
      targetRaise: { amount: 5_000_000, currency: 'USDC' },
      minTicket: { amount: 25_000, currency: 'USDC' },
      opensAt: '2026-12-31',
      closesAt: '2026-11-01',
      distributionFrequency: 'quarterly',
      eligibility: 'Eligible investors in permitted jurisdictions',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid evidence digest', () => {
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
  });
});
