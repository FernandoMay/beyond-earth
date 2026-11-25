import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Memo,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

import {
  assertNetworkIsTestnet,
  isValidAccountAddress,
  resolveStellarConfig,
  transactionExplorerUrl,
  type StellarNetworkConfig,
} from './index';

export const CHALLENGE_PAYMENT_MEMO = 'SHIP-S97KF8';

export interface SendStellarPaymentInput {
  sourceSecretKey: string;
  destination: string;
  amount: string;
  memo?: string;
  asset?: 'native';
  config?: StellarNetworkConfig;
}

export interface StellarPaymentResult {
  hash: string;
  ledger?: number;
  source: string;
  destination: string;
  amount: string;
  memo: string;
  explorerUrl: string;
}

/**
 * Build, sign and submit a single Stellar payment from the server side using a
 * configured testnet source account. This is intentionally testnet-only: mainnet
 * configurations are rejected before any signing happens.
 */
export async function sendStellarPayment(
  input: SendStellarPaymentInput,
): Promise<StellarPaymentResult> {
  const config = input.config ?? resolveStellarConfig();
  assertNetworkIsTestnet(config);

  if (!input.sourceSecretKey.startsWith('S')) {
    throw new Error('A Stellar secret key (S...) is required to send a payment.');
  }

  if (!isValidAccountAddress(input.destination)) {
    throw new Error('Destination must be a valid Stellar account address.');
  }

  const sourceKeypair = Keypair.fromSecret(input.sourceSecretKey);
  const memoText = input.memo ?? CHALLENGE_PAYMENT_MEMO;

  const server = new Horizon.Server(config.horizonUrl);
  const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: config.passphrase,
  })
    .addOperation(
      Operation.payment({
        destination: input.destination,
        asset: Asset.native(),
        amount: input.amount,
      }),
    )
    .addMemo(Memo.text(memoText))
    .setTimeout(60)
    .build();

  transaction.sign(sourceKeypair);

  const submitted = await server.submitTransaction(transaction);

  return {
    hash: submitted.hash,
    ledger: submitted.ledger,
    source: sourceKeypair.publicKey(),
    destination: input.destination,
    amount: input.amount,
    memo: memoText,
    explorerUrl: transactionExplorerUrl(config, submitted.hash),
  };
}
