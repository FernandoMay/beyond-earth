import { Indexer, FileIndexerStore, PostgresIndexerStore, type ChainEvent } from './index';
import { fetchSorobanEvents } from './rpc';

const RPC_URL = process.env.STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const CONTRACT_IDS = (process.env.STELLAR_CONTRACT_IDS ?? '').split(',').filter(Boolean);
const START_LEDGER = Number(process.env.STELLAR_INDEXER_START_LEDGER ?? '1');
const POLL_MS = Number(process.env.STELLAR_INDEXER_POLL_MS ?? '5000');

async function main() {
  let store: FileIndexerStore | PostgresIndexerStore;
  if (process.env.DATABASE_URL) {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
    store = new PostgresIndexerStore({
      async query<T>(text: string, values?: unknown[]) {
        const result = await pool.query(text, values);
        return { rows: result.rows as T[] };
      },
    });
  } else {
    store = new FileIndexerStore(
      process.env.STELLAR_INDEXER_CURSOR_FILE ?? '.data/indexer-cursor.json',
    );
  }
  const indexer = new Indexer({
    store,
    handler: async (event) => {
      console.log('processed', event.id);
    },
  });
  let cursor = START_LEDGER;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const events = await fetchSorobanEvents({
        rpcUrl: RPC_URL,
        contractIds: CONTRACT_IDS,
        startLedger: cursor,
      });
      if (events.length) {
        const mapped = events.map((e) => {
          const topic = Array.isArray(e.topic) && e.topic.length ? String(e.topic[0]) : '';
          const typeMap: Record<string, ChainEvent['type']> = {
            asset_registered: 'asset.registered',
            asset_verified: 'asset.verified',
            asset_suspended: 'asset.suspended',
            subscribed: 'investment.subscribed',
            offering_settled: 'investment.settled',
            refunded: 'investment.refunded',
            distribution_claimed: 'distribution.claimed',
            lease_payment: 'lease.payment',
            lease_defaulted: 'lease.defaulted',
            compliance_updated: 'compliance.updated',
            oracle_updated: 'oracle.updated',
          };
          const type = typeMap[topic] ?? 'asset.registered';
          return {
            id: e.id,
            contractId: e.contractId,
            ledger: e.ledger,
            type,
            occurredAt: new Date(e.ledgerClosedAt ?? Date.now()),
            payload: (e.value ?? {}) as unknown as Record<string, unknown>,
            txHash: e.txHash,
          };
        });
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
