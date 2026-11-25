import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  OracleAdapter,
  assertVerified,
  canonicalReading,
  verifyOracleReading,
  type OraclePolicy,
} from '../src/index';

const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

function signedReading(
  overrides: Partial<{
    assetId: string;
    source: string;
    value: number;
    currency: 'USD' | 'USDC' | 'EUR';
    observedAt: Date;
  }> = {},
) {
  const unsigned = {
    assetId: 'ast_eng_001',
    source: 'meridian-lease-index',
    value: 412_500,
    currency: 'USD' as const,
    observedAt: new Date('2026-06-01T12:00:00Z'),
    ...overrides,
  };
  return {
    ...unsigned,
    signature: sign(null, Buffer.from(canonicalReading(unsigned)), privateKey).toString('base64'),
  };
}

const now = new Date('2026-06-01T12:05:00Z');
const policy: OraclePolicy = {
  allowedSources: ['meridian-lease-index'],
  publicKeyPem,
  maxAgeSeconds: 900,
  minValue: 100_000,
  maxValue: 1_000_000,
};

describe('canonicalReading', () => {
  it('is stable and includes the full six-decimal value', () => {
    expect(
      canonicalReading({
        assetId: 'ast_eng_001',
        source: 'meridian-lease-index',
        value: 412_500.1,
        currency: 'USD',
        observedAt: new Date('2026-06-01T12:00:00Z'),
      }),
    ).toBe(
      'aerospace-oracle-v1|ast_eng_001|meridian-lease-index|412500.100000|USD|2026-06-01T12:00:00.000Z',
    );
  });
});

describe('verifyOracleReading', () => {
  it('accepts a signed, fresh, in-band reading', () => {
    const result = verifyOracleReading(signedReading(), policy, now);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.reading.value).toBe(412_500);
      expect(result.ageSeconds).toBe(300);
    }
  });

  it('rejects a tampered value', () => {
    const reading = signedReading();
    const result = verifyOracleReading({ ...reading, value: 999_999 }, policy, now);
    expect(result).toMatchObject({ ok: false, code: 'INVALID_SIGNATURE' });
  });

  it('rejects a reading signed by a different key', () => {
    const other = generateKeyPairSync('ed25519');
    const unsigned = {
      assetId: 'ast_eng_001',
      source: 'meridian-lease-index',
      value: 412_500,
      currency: 'USD' as const,
      observedAt: new Date('2026-06-01T12:00:00Z'),
    };
    const signature = sign(
      null,
      Buffer.from(canonicalReading(unsigned)),
      other.privateKey,
    ).toString('base64');
    const result = verifyOracleReading({ ...unsigned, signature }, policy, now);
    expect(result).toMatchObject({ ok: false, code: 'INVALID_SIGNATURE' });
  });

  it('rejects stale readings', () => {
    const result = verifyOracleReading(signedReading(), policy, new Date('2026-06-01T13:00:00Z'));
    expect(result).toMatchObject({ ok: false, code: 'STALE_READING' });
  });

  it('rejects readings too far in the future', () => {
    const result = verifyOracleReading(
      signedReading({ observedAt: new Date('2026-06-01T12:10:00Z') }),
      policy,
      now,
    );
    expect(result).toMatchObject({ ok: false, code: 'FUTURE_READING' });
  });

  it('rejects unapproved sources', () => {
    const result = verifyOracleReading(signedReading({ source: 'random-feed' }), policy, now);
    expect(result).toMatchObject({ ok: false, code: 'UNKNOWN_SOURCE' });
  });

  it('rejects values outside the configured band', () => {
    const result = verifyOracleReading(signedReading({ value: 80_000 }), policy, now);
    expect(result).toMatchObject({ ok: false, code: 'OUT_OF_BAND' });
  });

  it('rejects malformed input without throwing', () => {
    const result = verifyOracleReading({ assetId: '' }, policy, now);
    expect(result).toMatchObject({ ok: false, code: 'INVALID_READING' });
  });

  it('reports zero age for slightly future readings within skew', () => {
    const result = verifyOracleReading(
      signedReading({ observedAt: new Date('2026-06-01T12:05:30Z') }),
      policy,
      now,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.ageSeconds).toBe(0);
  });
});

describe('OracleAdapter', () => {
  it('verifies batches and exposes the feed name', () => {
    const adapter = new OracleAdapter('engine-lease-index', policy);
    const results = adapter.verifyAll([signedReading(), { assetId: 'broken' }], now);
    expect(adapter.feed).toBe('engine-lease-index');
    expect(results.map((result) => result.ok)).toEqual([true, false]);
  });

  it('assertVerified throws with the rejection code', () => {
    const rejection = verifyOracleReading({}, policy, now);
    expect(() => assertVerified(rejection)).toThrow(/INVALID_READING/);
  });
});
