import { describe, expect, it } from 'vitest';
import {
  formatTokenAmount,
  isValidAccountAddress,
  isValidContractAddress,
  parseTokenAmount,
  resolveStellarConfig,
  truncateAddress,
} from '../src';

describe('Stellar utilities', () => {
  it('defaults to Testnet and never silently enables Mainnet', () => {
    const config = resolveStellarConfig({});
    expect(config.network).toBe('testnet');
    expect(config.isProduction).toBe(false);
    expect(config.passphrase).toContain('Test SDF Network');
  });

  it('requires an explicit Mainnet opt-in', () => {
    const blocked = resolveStellarConfig({ STELLAR_NETWORK: 'mainnet' });
    expect(blocked.network).toBe('testnet');

    const allowed = resolveStellarConfig({
      STELLAR_NETWORK: 'mainnet',
      STELLAR_ALLOW_MAINNET: 'true',
    });
    expect(allowed.network).toBe('mainnet');
    expect(allowed.isProduction).toBe(true);
  });

  it('validates account and contract addresses', () => {
    expect(
      isValidAccountAddress('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'),
    ).toBe(true);
    expect(isValidAccountAddress('CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4')).toBe(
      false,
    );
    expect(
      isValidContractAddress('CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4'),
    ).toBe(true);
  });

  it('parses token amounts without floating point error', () => {
    expect(parseTokenAmount('1.5')).toBe(15_000_000n);
    expect(parseTokenAmount('0.0000001')).toBe(1n);
    expect(() => parseTokenAmount('1.12345678')).toThrow();
    expect(() => parseTokenAmount('-1')).toThrow();
  });

  it('formats token amounts for display', () => {
    expect(formatTokenAmount(15_000_000n)).toBe('1.5');
    expect(formatTokenAmount(1_250_000_000n, 7, 2)).toBe('125');
  });

  it('truncates addresses for display only', () => {
    const address = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    expect(truncateAddress(address)).toBe('GAAAAA…AAAWHF');
  });
});
