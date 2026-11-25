import { Indexer, InMemoryIndexerStore } from './index';
import { fetchSorobanEvents } from './rpc';

const RPC_URL = process.env.STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const CONTRACT_IDS = (process.env.STELLAR_CONTRACT_IDS ?? '').split(',').filter(Boolean);
const START_LEDGER = Number(process.env.STELLAR_INDEXER_START_LEDGER ?? '1');
const POLL_MS = Number(process.env.STELLAR_INDEXER_POLL_MS ?? '5000');

async function main() {
  const store = new InMemoryIndexerStore();
  const indexer = new Indexer({ store, handler: async (event) => { console.log('processed', event.id); } });
  let cursor = START_LEDGER;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const events = await fetchSorobanEvents({ rpcUrl: RPC_URL, contractIds: CONTRACT_IDS, startLedger: cursor });
      if (events.length) {
        const mapped = events.map((e) => ({
          id: e.id,
          contractId: e.contractId,
          ledger: e.ledger,
          type: 'asset.registered' as const,
          occurredAt: new Date(e.ledgerClosedAt ?? Date.now()),
          payload: (e.value ?? {}) as unknown as Record<string, unknown>,
        }));
        await indexer.process(mapped as never);
        const last = events[events.length - 1];
        if (last) cursor = last.ledger + 1;
      }
    } catch (error) {
      console.error('indexer error', error);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

void main();
