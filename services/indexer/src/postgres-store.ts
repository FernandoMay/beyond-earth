import type { IndexerStore } from './index';

export interface PgClient {
  query<T>(text: string, values?: unknown[]): Promise<{ rows: T[] }>;
}

/**
 * PostgreSQL-backed indexer store. Persists cursors and processed event ids
 * so the indexer can resume after a restart.
 */
export class PostgresIndexerStore implements IndexerStore {
  constructor(private readonly client: PgClient) {}

  async getCursor(stream: string): Promise<number | null> {
    const result = await this.client.query<{ cursor: number | null }>(
      'select cursor from indexer_cursors where stream = $1',
      [stream],
    );
    return result.rows[0]?.cursor ?? null;
  }

  async setCursor(stream: string, ledger: number): Promise<void> {
    await this.client.query(
      `insert into indexer_cursors (stream, cursor, updated_at)
       values ($1, $2, now())
       on conflict (stream) do update set cursor = greatest(indexer_cursors.cursor, excluded.cursor), updated_at = now()`,
      [stream, ledger],
    );
  }

  async hasProcessed(eventId: string): Promise<boolean> {
    const result = await this.client.query<{ exists: boolean }>(
      'select exists(select 1 from processed_events where event_id = $1) as exists',
      [eventId],
    );
    return result.rows[0]?.exists ?? false;
  }

  async markProcessed(eventId: string): Promise<void> {
    await this.client.query(
      'insert into processed_events (event_id, processed_at) values ($1, now()) on conflict do nothing',
      [eventId],
    );
  }
}
