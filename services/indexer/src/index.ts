import { z } from 'zod';

/**
 * Contract events consumed by the indexer.
 *
 * Soroban emits contract events with a contract id and a transaction hash. This
 * schema is deliberately explicit so a malformed event stops the pipeline instead
 * of silently corrupting an asset or investment record.
 */
export const chainEventSchema = z.object({
  id: z.string().min(1).max(128),
  contractId: z.string().min(1).max(128),
  ledger: z.number().int().nonnegative(),
  type: z.enum([
    'asset.registered',
    'asset.verified',
    'asset.suspended',
    'investment.subscribed',
    'investment.settled',
    'investment.refunded',
    'distribution.published',
    'distribution.claimed',
    'lease.payment',
    'lease.defaulted',
    'compliance.updated',
    'oracle.updated',
  ]),
  txHash: z
    .string()
    .regex(/^[a-f0-9]{64}$/i, 'Expected a 64-character transaction hash')
    .optional(),
  occurredAt: z.coerce.date(),
  payload: z.record(z.unknown()),
});

export type ChainEvent = z.infer<typeof chainEventSchema>;

export interface IndexerStore {
  getCursor(stream: string): Promise<number | null>;
  setCursor(stream: string, ledger: number): Promise<void>;
  hasProcessed(eventId: string): Promise<boolean>;
  markProcessed(eventId: string): Promise<void>;
}

export interface ProcessResult {
  stream: string;
  processed: string[];
  duplicates: string[];
  belowCursor: string[];
  failed: Array<{ eventId: string; message: string }>;
  cursor: number | null;
}

export type EventHandler = (event: ChainEvent) => Promise<void>;

export interface IndexerOptions {
  store: IndexerStore;
  handler: EventHandler;
  stream?: string;
  /** Clock injection keeps freshness and cursor tests deterministic. */
  now?: () => Date;
}

/**
 * Idempotent, ordered event processor.
 *
 * Events are sorted by ledger before handling and each event id is recorded only
 * after its handler succeeds. Cursor advancement stops at the first failure so an
 * operator can replay from a known-good ledger without skipping work.
 */
export class Indexer {
  private readonly store: IndexerStore;
  private readonly handler: EventHandler;
  private readonly stream: string;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(options: IndexerOptions) {
    this.store = options.store;
    this.handler = options.handler;
    this.stream = options.stream ?? 'stellar-events';
  }

  process(events: ChainEvent[]): Promise<ProcessResult> {
    // Serialize batches so concurrent workers cannot both process the same event.
    const run = this.queue.then(() => this.processBatch(events));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async processBatch(events: ChainEvent[]): Promise<ProcessResult> {
    const parsed = events.map((event) => chainEventSchema.parse(event));
    const ordered = [...parsed].sort((left, right) =>
      left.ledger === right.ledger ? left.id.localeCompare(right.id) : left.ledger - right.ledger,
    );

    const startCursor = await this.store.getCursor(this.stream);
    let cursor = startCursor;
    const result: ProcessResult = {
      stream: this.stream,
      processed: [],
      duplicates: [],
      belowCursor: [],
      failed: [],
      cursor: startCursor,
    };

    for (const event of ordered) {
      if (await this.store.hasProcessed(event.id)) {
        result.duplicates.push(event.id);
        continue;
      }
      if (cursor !== null && event.ledger <= cursor) {
        result.belowCursor.push(event.id);
        continue;
      }
      try {
        await this.handler(event);
        await this.store.markProcessed(event.id);
        result.processed.push(event.id);
        cursor = event.ledger;
        await this.store.setCursor(this.stream, event.ledger);
      } catch (error) {
        result.failed.push({
          eventId: event.id,
          message: error instanceof Error ? error.message : 'Unknown handler error',
        });
        break;
      }
    }

    result.cursor = cursor;
    return result;
  }
}

export class InMemoryIndexerStore implements IndexerStore {
  private readonly cursors = new Map<string, number>();
  private readonly processed = new Set<string>();

  async getCursor(stream: string): Promise<number | null> {
    return this.cursors.get(stream) ?? null;
  }

  async setCursor(stream: string, ledger: number): Promise<void> {
    const current = this.cursors.get(stream);
    if (current === undefined || ledger > current) {
      this.cursors.set(stream, ledger);
    }
  }

  async hasProcessed(eventId: string): Promise<boolean> {
    return this.processed.has(eventId);
  }

  async markProcessed(eventId: string): Promise<void> {
    this.processed.add(eventId);
  }
}
