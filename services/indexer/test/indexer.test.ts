import { describe, expect, it, vi } from 'vitest';
import { Indexer, InMemoryIndexerStore, chainEventSchema, type ChainEvent } from '../src/index';

function event(overrides: Partial<ChainEvent> = {}): ChainEvent {
  return {
    id: 'evt_001',
    contractId: 'CDEMO_CONTRACT',
    ledger: 100,
    type: 'asset.registered',
    occurredAt: new Date('2026-01-01T00:00:00Z'),
    payload: { assetId: 'ast_eng_001' },
    ...overrides,
  };
}

describe('chainEventSchema', () => {
  it('rejects malformed transaction hashes', () => {
    expect(() => chainEventSchema.parse(event({ txHash: 'not-a-hash' }))).toThrow();
  });

  it('rejects negative ledgers', () => {
    expect(() => chainEventSchema.parse(event({ ledger: -1 }))).toThrow();
  });
});

describe('Indexer', () => {
  it('processes events in ledger order regardless of arrival order', async () => {
    const seen: number[] = [];
    const indexer = new Indexer({
      store: new InMemoryIndexerStore(),
      handler: async (item) => {
        seen.push(item.ledger);
      },
    });

    const result = await indexer.process([
      event({ id: 'evt_300', ledger: 300 }),
      event({ id: 'evt_100', ledger: 100 }),
      event({ id: 'evt_200', ledger: 200 }),
    ]);

    expect(seen).toEqual([100, 200, 300]);
    expect(result.processed).toEqual(['evt_100', 'evt_200', 'evt_300']);
    expect(result.cursor).toBe(300);
  });

  it('does not invoke the handler twice for a replayed event', async () => {
    const handler = vi.fn(async () => undefined);
    const store = new InMemoryIndexerStore();
    const indexer = new Indexer({ store, handler });

    await indexer.process([event()]);
    const replay = await indexer.process([event()]);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(replay.duplicates).toEqual(['evt_001']);
    expect(replay.processed).toEqual([]);
  });

  it('reports duplicates that share an event id inside a batch', async () => {
    const handler = vi.fn(async () => undefined);
    const indexer = new Indexer({ store: new InMemoryIndexerStore(), handler });

    const result = await indexer.process([
      event({ id: 'evt_same', ledger: 10 }),
      event({ id: 'evt_same', ledger: 10 }),
    ]);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(result.duplicates).toEqual(['evt_same']);
    expect(result.cursor).toBe(10);
  });

  it('stops at a failed handler and preserves the last good cursor', async () => {
    const handler = vi.fn(async (item: ChainEvent) => {
      if (item.id === 'evt_bad') throw new Error('decoder mismatch');
    });
    const indexer = new Indexer({ store: new InMemoryIndexerStore(), handler });

    const result = await indexer.process([
      event({ id: 'evt_ok', ledger: 10 }),
      event({ id: 'evt_bad', ledger: 11 }),
      event({ id: 'evt_after', ledger: 12 }),
    ]);

    expect(result.processed).toEqual(['evt_ok']);
    expect(result.failed).toEqual([{ eventId: 'evt_bad', message: 'decoder mismatch' }]);
    expect(result.cursor).toBe(10);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(result.processed).not.toContain('evt_after');
  });

  it('retries the failed event on the next batch', async () => {
    let fail = true;
    const handler = vi.fn(async () => {
      if (fail) throw new Error('temporary RPC failure');
    });
    const indexer = new Indexer({ store: new InMemoryIndexerStore(), handler });

    const first = await indexer.process([event({ id: 'evt_retry', ledger: 5 })]);
    expect(first.failed).toHaveLength(1);

    fail = false;
    const second = await indexer.process([event({ id: 'evt_retry', ledger: 5 })]);
    expect(second.processed).toEqual(['evt_retry']);
    expect(second.cursor).toBe(5);
  });

  it('serializes overlapping batches', async () => {
    let active = 0;
    let maxActive = 0;
    const store = new InMemoryIndexerStore();
    const indexer = new Indexer({
      store,
      handler: async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 2));
        active -= 1;
      },
    });

    await Promise.all([
      indexer.process([event({ id: 'evt_a', ledger: 1 })]),
      indexer.process([event({ id: 'evt_b', ledger: 2 })]),
    ]);

    expect(maxActive).toBe(1);
    expect(await store.getCursor('stellar-events')).toBe(2);
  });
});
