import {
  BASE_FEE,
  Contract,
  Keypair,
  nativeToScVal,
  rpc,
  scValToNative,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

import {
  assertNetworkIsTestnet,
  isValidAccountAddress,
  isValidContractAddress,
  resolveStellarConfig,
  type StellarNetworkConfig,
} from './index';

const DEFAULT_SIMULATION_SOURCE = 'GBXM3X7CKJNCIOXQAJ5Y6MN3EWVEOPEIEI6AWOUNZWL5BHLDL625N6US';

export interface SorobanReadResult {
  contractId: string;
  method: string;
  result: unknown;
}

export interface SorobanInvokeResult {
  contractId: string;
  method: string;
  hash: string;
  result: unknown;
  explorerUrl: string;
}

function toScVal(value: unknown) {
  if (value && typeof value === 'object' && 'switch' in (value as object)) {
    return value as ReturnType<typeof nativeToScVal>;
  }
  if (
    typeof value === 'string' &&
    (isValidAccountAddress(value) || isValidContractAddress(value))
  ) {
    return nativeToScVal(value, { type: 'address' });
  }
  return nativeToScVal(value as Parameters<typeof nativeToScVal>[0]);
}

export async function readSorobanContract(input: {
  contractId: string;
  method: string;
  args?: unknown[];
  sourceAddress?: string;
  config?: StellarNetworkConfig;
}): Promise<SorobanReadResult> {
  const config = input.config ?? resolveStellarConfig();
  assertNetworkIsTestnet(config);

  if (!isValidContractAddress(input.contractId)) {
    throw new Error('A valid Soroban contract address is required.');
  }

  const sourceAddress = input.sourceAddress ?? DEFAULT_SIMULATION_SOURCE;
  if (!isValidAccountAddress(sourceAddress)) {
    throw new Error('A valid simulation source account is required.');
  }

  const server = new rpc.Server(config.rpcUrl);
  const account = await server.getAccount(sourceAddress);
  const contract = new Contract(input.contractId);
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.passphrase,
  })
    .addOperation(contract.call(input.method, ...(input.args ?? []).map(toScVal)))
    .setTimeout(60)
    .build();

  const simulation = await server.simulateTransaction(transaction);
  if ('error' in simulation && simulation.error) {
    throw new Error(String(simulation.error));
  }

  const returnValue = 'result' in simulation ? simulation.result?.retval : undefined;
  return {
    contractId: input.contractId,
    method: input.method,
    result: returnValue ? scValToNative(returnValue) : null,
  };
}

export async function invokeSorobanContract(input: {
  sourceSecretKey: string;
  contractId: string;
  method: string;
  args?: unknown[];
  config?: StellarNetworkConfig;
}): Promise<SorobanInvokeResult> {
  const config = input.config ?? resolveStellarConfig();
  assertNetworkIsTestnet(config);

  if (!isValidContractAddress(input.contractId)) {
    throw new Error('A valid Soroban contract address is required.');
  }

  const sourceKeypair = Keypair.fromSecret(input.sourceSecretKey);
  const server = new rpc.Server(config.rpcUrl);
  const account = await server.getAccount(sourceKeypair.publicKey());
  const contract = new Contract(input.contractId);

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.passphrase,
  })
    .addOperation(contract.call(input.method, ...(input.args ?? []).map(toScVal)))
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(transaction);
  prepared.sign(sourceKeypair);

  const submitted = await server.sendTransaction(prepared);
  if (submitted.status === 'ERROR') {
    throw new Error(submitted.errorResult?.toString() ?? 'Soroban transaction failed.');
  }

  // Poll for completion.
  let getResult = await server.getTransaction(submitted.hash);
  const deadline = Date.now() + 30_000;
  while (getResult.status === 'NOT_FOUND' && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    getResult = await server.getTransaction(submitted.hash);
  }

  if (getResult.status !== 'SUCCESS') {
    throw new Error(`Soroban transaction ${submitted.hash} ended with status ${getResult.status}.`);
  }

  const returnValue = getResult.returnValue;
  return {
    contractId: input.contractId,
    method: input.method,
    hash: submitted.hash,
    result: returnValue ? scValToNative(returnValue) : null,
    explorerUrl: `${config.explorerBaseUrl}/tx/${encodeURIComponent(submitted.hash)}`,
  };
}
