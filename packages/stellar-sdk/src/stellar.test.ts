import { describe, expect, it } from 'vitest';
import { CHALLENGE_PAYMENT_MEMO, resolveStellarConfig } from '../src';

describe('Stellar integration constants', () => {
  it('uses the challenge memo code', () => {
    expect(CHALLENGE_PAYMENT_MEMO).toBe('SHIP-S97KF8');
  });

  it('defaults to Testnet for contract interactions', () => {
    const config = resolveStellarConfig({});
    expect(config.network).toBe('testnet');
    expect(config.rpcUrl).toContain('soroban-testnet');
  });
});
