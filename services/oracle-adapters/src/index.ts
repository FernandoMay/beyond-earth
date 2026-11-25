import { createPublicKey, verify } from 'node:crypto';
import { z } from 'zod';

export const oracleReadingSchema = z.object({
  assetId: z.string().min(3).max(64),
  source: z.string().min(2).max(120),
  value: z.number().finite().positive(),
  currency: z.enum(['USD', 'USDC', 'EUR']),
  observedAt: z.coerce.date(),
  /** Base64 Ed25519 signature over the canonical reading string. */
  signature: z.string().min(32),
});

export type OracleReading = z.infer<typeof oracleReadingSchema>;

export interface OraclePolicy {
  /** Source identifiers allowed to publish readings for this feed. */
  allowedSources: string[];
  /** Ed25519 public key in PEM (SPKI) form, as published by the oracle. */
  publicKeyPem: string;
  /** A reading older than this is rejected as stale. */
  maxAgeSeconds: number;
  /** Tolerated clock skew for readings dated slightly in the future. */
  maxFutureSkewSeconds?: number;
  /** Optional sanity band for a feed. */
  minValue?: number;
  maxValue?: number;
}

export type OracleRejectionCode =
  | 'INVALID_SIGNATURE'
  | 'UNKNOWN_SOURCE'
  | 'STALE_READING'
  | 'FUTURE_READING'
  | 'OUT_OF_BAND'
  | 'INVALID_READING';

export type OracleVerification =
  | { ok: true; reading: OracleReading; ageSeconds: number }
  | { ok: false; code: OracleRejectionCode; message: string };

/**
 * Canonical byte representation that oracles sign. The field order is fixed and
 * documented so external publishers can reproduce it exactly.
 */
export function canonicalReading(reading: Omit<OracleReading, 'signature'>): string {
  return [
    'aerospace-oracle-v1',
    reading.assetId,
    reading.source,
    reading.value.toFixed(6),
    reading.currency,
    reading.observedAt.toISOString(),
  ].join('|');
}

export function verifyOracleReading(
  input: unknown,
  policy: OraclePolicy,
  now: Date = new Date(),
): OracleVerification {
  const parsed = oracleReadingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: 'INVALID_READING', message: parsed.error.issues[0]?.message ?? 'Invalid reading' };
  }
  const reading = parsed.data;

  if (!policy.allowedSources.includes(reading.source)) {
    return {
      ok: false,
      code: 'UNKNOWN_SOURCE',
      message: `Source "${reading.source}" is not approved for this feed.`,
    };
  }

  const observedAt = reading.observedAt.getTime();
  const nowMs = now.getTime();
  const ageSeconds = Math.floor((nowMs - observedAt) / 1000);
  if (ageSeconds > policy.maxAgeSeconds) {
    return {
      ok: false,
      code: 'STALE_READING',
      message: `Reading is ${ageSeconds}s old; maximum age is ${policy.maxAgeSeconds}s.`,
    };
  }
  if (ageSeconds < -Math.abs(policy.maxFutureSkewSeconds ?? 60)) {
    return {
      ok: false,
      code: 'FUTURE_READING',
      message: 'Reading is dated too far in the future.',
    };
  }
  if (policy.minValue !== undefined && reading.value < policy.minValue) {
    return { ok: false, code: 'OUT_OF_BAND', message: `Value is below the feed minimum.` };
  }
  if (policy.maxValue !== undefined && reading.value > policy.maxValue) {
    return { ok: false, code: 'OUT_OF_BAND', message: `Value is above the feed maximum.` };
  }

  let valid = false;
  try {
    const key = createPublicKey(policy.publicKeyPem);
    valid = verify(
      null,
      Buffer.from(canonicalReading(reading), 'utf8'),
      key,
      Buffer.from(reading.signature, 'base64'),
    );
  } catch {
    valid = false;
  }
  if (!valid) {
    return {
      ok: false,
      code: 'INVALID_SIGNATURE',
      message: 'Reading signature does not match the approved oracle key.',
    };
  }

  return { ok: true, reading, ageSeconds: Math.max(ageSeconds, 0) };
}

/**
 * A named feed policy. Adapters stay deliberately small: they verify and expose
 * readings, while contracts and the API decide what a trusted reading authorises.
 */
export class OracleAdapter {
  constructor(
    readonly feed: string,
    readonly policy: OraclePolicy,
  ) {}

  verify(input: unknown, now: Date = new Date()): OracleVerification {
    return verifyOracleReading(input, this.policy, now);
  }

  verifyAll(inputs: unknown[], now: Date = new Date()): OracleVerification[] {
    return inputs.map((input) => this.verify(input, now));
  }
}

export function assertVerified(verification: OracleVerification): OracleReading {
  if (!verification.ok) {
    throw new Error(`Oracle reading rejected (${verification.code}): ${verification.message}`);
  }
  return verification.reading;
}
