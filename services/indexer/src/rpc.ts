import { rpc } from '@stellar/stellar-sdk';

export interface FetchEventsOptions {
  rpcUrl: string;
  contractIds: string[];
  startLedger: number;
  limit?: number;
}

export async function fetchSorobanEvents(options: FetchEventsOptions) {
  const server = new rpc.Server(options.rpcUrl);
  const response = await server.getEvents({
    startLedger: options.startLedger,
    filters: options.contractIds.map((contractId) => ({
      type: 'contract' as const,
      contractIds: [contractId],
    })),
    limit: options.limit ?? 100,
  });
  return response.events ?? [];
}
