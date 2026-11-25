import { StrKey } from '@stellar/stellar-sdk';

export type StellarNetwork = 'testnet' | 'mainnet' | 'futurenet' | 'local';

export interface StellarNetworkConfig {
  network: StellarNetwork;
  rpcUrl: string;
  horizonUrl: string;
  passphrase: string;
  explorerBaseUrl: string;
  isProduction: boolean;
}

const NETWORKS: Record<StellarNetwork, Omit<StellarNetworkConfig, 'network' | 'isProduction'>> = {
  testnet: {
    rpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    passphrase: 'Test SDF Network ; September 2015',
    explorerBaseUrl: 'https://stellar.expert/explorer/testnet',
  },
  futurenet: {
    rpcUrl: 'https://rpc-futurenet.stellar.org',
    horizonUrl: 'https://horizon-futurenet.stellar.org',
    passphrase: 'Test SDF Future Network ; October 2022',
    explorerBaseUrl: 'https://stellar.expert/explorer/futurenet',
  },
  mainnet: {
    rpcUrl: 'https://mainnet.sorobanrpc.com',
    horizonUrl: 'https://horizon.stellar.org',
    passphrase: 'Public Global Stellar Network ; September 2015',
    explorerBaseUrl: 'https://stellar.expert/explorer/public',
  },
  local: {
    rpcUrl: 'http://localhost:8000/soroban/rpc',
    horizonUrl: 'http://localhost:8000',
    passphrase: 'Standalone Network ; February 2017',
    explorerBaseUrl: 'http://localhost:8000',
  },
};

function asNetwork(value: string | undefined): StellarNetwork {
  if (value === 'mainnet' || value === 'futurenet' || value === 'local') return value;
  return 'testnet';
}

/**
 * Resolve network configuration. Mainnet deliberately requires an explicit
 * environment flag; the default is always Testnet.
 */
export function resolveStellarConfig(
  env: Record<string, string | undefined> = process.env,
): StellarNetworkConfig {
  const network = asNetwork(env.NEXT_PUBLIC_STELLAR_NETWORK ?? env.STELLAR_NETWORK);
  const defaults = NETWORKS[network];

  if (network === 'mainnet' && env.STELLAR_ALLOW_MAINNET !== 'true') {
    return {
      network: 'testnet',
      ...NETWORKS.testnet,
      isProduction: false,
    };
  }

  return {
    network,
    rpcUrl: env.STELLAR_RPC_URL ?? env.NEXT_PUBLIC_STELLAR_RPC_URL ?? defaults.rpcUrl,
    horizonUrl:
      env.STELLAR_HORIZON_URL ?? env.NEXT_PUBLIC_STELLAR_HORIZON_URL ?? defaults.horizonUrl,
    passphrase:
      env.STELLAR_NETWORK_PASSPHRASE ??
      env.NEXT_PUBLIC_STELLAR_PASSPHRASE ??
      defaults.passphrase,
    explorerBaseUrl:
      env.NEXT_PUBLIC_EXPLORER_BASE_URL ?? defaults.explorerBaseUrl,
    isProduction: network === 'mainnet',
  };
}

export function isValidAccountAddress(address: string): boolean {
  return StrKey.isValidEd25519PublicKey(address);
}

export function isValidContractAddress(address: string): boolean {
  return StrKey.isValidContract(address);
}

export function truncateAddress(address: string, visible = 6): string {
  if (address.length <= visible * 2 + 1) return address;
  return `${address.slice(0, visible)}…${address.slice(-visible)}`;
}

export function accountExplorerUrl(config: StellarNetworkConfig, address: string): string {
  return `${config.explorerBaseUrl}/account/${encodeURIComponent(address)}`;
}

export function contractExplorerUrl(config: StellarNetworkConfig, contractId: string): string {
  return `${config.explorerBaseUrl}/contract/${encodeURIComponent(contractId)}`;
}

export function transactionExplorerUrl(config: StellarNetworkConfig, hash: string): string {
  return `${config.explorerBaseUrl}/tx/${encodeURIComponent(hash)}`;
}

/**
 * Parse a decimal token amount into integer stroops without floating-point
 * arithmetic. Supports at most 7 decimal places (Stellar's native precision).
 */
export function parseTokenAmount(value: string, decimals = 7): bigint {
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error('Amount must be a non-negative decimal number');
  }
  if (decimals < 0 || decimals > 18) {
    throw new Error('Decimals must be between 0 and 18');
  }

  const [whole = '0', fraction = ''] = value.split('.');
  if (fraction.length > decimals) {
    throw new Error(`Amount has more than ${decimals} decimal places`);
  }

  const padded = fraction.padEnd(decimals, '0');
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(padded || '0');
}

export function formatTokenAmount(value: bigint, decimals = 7, maxFractionDigits = 2): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const scale = 10n ** BigInt(decimals);
  const whole = absolute / scale;
  const fraction = absolute % scale;

  const fractionText = fraction
    .toString()
    .padStart(decimals, '0')
    .slice(0, Math.min(decimals, maxFractionDigits))
    .replace(/0+$/, '');

  const base = new Intl.NumberFormat('en-US').format(whole);
  const sign = negative ? '-' : '';
  return fractionText ? `${sign}${base}.${fractionText}` : `${sign}${base}`;
}

export function assertNetworkIsTestnet(config: StellarNetworkConfig): void {
  if (config.isProduction) {
    throw new Error('Refusing to sign a test operation on Mainnet');
  }
}

export { NETWORKS };

export * from './payments';

export * from './horizon';
