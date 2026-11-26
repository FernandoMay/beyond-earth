import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { IndexerStore } from './index';

/**
 * File-backed indexer store. Persists cursors and processed event ids to disk
 * so an indexer process can resume after a restart.
 */
export class FileIndexerStore implements IndexerStore {
  private readonly path: string;
  private state: { cursors: Record<string, number>; processed: string[] } = {
    cursors: {},
    processed: [],
  };
  private loaded = false;

  constructor(path: string) {
    this.path = path;
  }

  private async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await readFile(this.path, 'utf8');
      const parsed = JSON.parse(raw) as { cursors?: Record<string, number>; processed?: string[] };
      this.state = {
        cursors: parsed.cursors ?? {},
        processed: parsed.processed ?? [],
      };
    } catch {
      // File may not exist yet; start empty.
    }
    this.loaded = true;
  }

  private async save(): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, JSON.stringify(this.state), 'utf8');
  }

  async getCursor(stream: string): Promise<number | null> {
    await this.load();
    return this.state.cursors[stream] ?? null;
  }

  async setCursor(stream: string, ledger: number): Promise<void> {
    await this.load();
    const current = this.state.cursors[stream];
    if (current === undefined || ledger > current) {
      this.state.cursors[stream] = ledger;
      await this.save();
    }
  }

  async hasProcessed(eventId: string): Promise<boolean> {
    await this.load();
    return this.state.processed.includes(eventId);
  }

  async markProcessed(eventId: string): Promise<void> {
    await this.load();
    if (!this.state.processed.includes(eventId)) {
      this.state.processed.push(eventId);
      await this.save();
    }
  }
}
