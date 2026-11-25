import { Horizon } from '@stellar/stellar-sdk';

import { resolveStellarConfig, transactionExplorerUrl, type StellarNetworkConfig } from './index';

export interface StellarAccountBalance {
  asset: string;
  balance: string;
}

export interface StellarAccountSummary {
  address: string;
  balances: StellarAccountBalance[];
  explorerUrl: string;
}

export interface StellarTransactionSummary {
  hash: string;
  successful: boolean;
  ledger?: number;
  memo?: string;
  memoType?: string;
  createdAt?: string;
  explorerUrl: string;
}

export async function fetchStellarAccount(
  address: string,
  config: StellarNetworkConfig = resolveStellarConfig(),
): Promise<StellarAccountSummary> {
  const server = new Horizon.Server(config.horizonUrl);
  const account = await server.loadAccount(address);
  return {
    address: account.accountId(),
    balances: account.balances.map((balance) => ({
      asset:
        balance.asset_type === 'native'
          ? 'XLM'
          : 'asset_code' in balance
            ? `${balance.asset_code}:${'asset_issuer' in balance ? balance.asset_issuer : ''}`
            : 'liquidity-pool',
      balance: balance.balance,
    })),
    explorerUrl: `${config.explorerBaseUrl}/account/${encodeURIComponent(address)}`,
  };
}

export async function fetchStellarTransaction(
  hash: string,
  config: StellarNetworkConfig = resolveStellarConfig(),
): Promise<StellarTransactionSummary> {
  const server = new Horizon.Server(config.horizonUrl);
  const transaction = await server.transactions().transaction(hash).call();
  return {
    hash: transaction.hash,
    successful: transaction.successful,
    ledger: transaction.ledger_attr,
    memo: transaction.memo,
    memoType: transaction.memo_type,
    createdAt: transaction.created_at,
    explorerUrl: transactionExplorerUrl(config, transaction.hash),
  };
}
