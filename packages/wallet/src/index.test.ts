import { describe, expect, it } from 'vitest';
import { networkMatches } from '../src';

describe('wallet network guard', () => {
  it('recognises testnet and mainnet passphrases', () => {
    expect(networkMatches('Test SDF Network ; September 2015', 'TESTNET')).toBe(true);
    expect(networkMatches('Public Global Stellar Network ; September 2015', 'TESTNET')).toBe(false);
    expect(networkMatches('Public Global Stellar Network ; September 2015', 'MAINNET')).toBe(true);
  });

  it('fails closed for mismatched networks', () => {
    expect(networkMatches('Public Global Stellar Network ; September 2015', 'TESTNET')).toBe(false);
  });
});
