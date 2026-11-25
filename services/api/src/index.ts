import { buildServer } from './server';
import { DEFAULT_PORT } from './constants';
import { InMemoryRepository } from './repository';
import { PostgresRepository } from './postgres-repository';

type Repository = Awaited<ReturnType<typeof createRepository>>;

async function createRepository(
  demoMode: boolean,
): Promise<InMemoryRepository | PostgresRepository> {
  if (demoMode) return new InMemoryRepository();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required when DEMO_MODE is false.');
  }
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString, max: 10 });
  return new PostgresRepository({
    async query<T>(text: string, values?: unknown[]) {
      const result = await pool.query(text, values);
      return { rows: result.rows as T[] };
    },
  });
}

function parseDemoMode(value: string | undefined): boolean {
  if (value === undefined || value === '') return true;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`DEMO_MODE must be "true" or "false", received "${value}".`);
}

async function main() {
  const demoMode = parseDemoMode(process.env.DEMO_MODE);
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535, received "${process.env.PORT}".`);
  }
  if (process.env.STELLAR_NETWORK === 'mainnet' && process.env.STELLAR_ALLOW_MAINNET !== 'true') {
    throw new Error('STELLAR_NETWORK=mainnet requires STELLAR_ALLOW_MAINNET=true.');
  }

  const repository: Repository = await createRepository(demoMode);
  const app = await buildServer({
    repository,
    demoMode,
    apiKey: process.env.API_KEY,
    logger: process.env.NODE_ENV !== 'test',
  });

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutting down');
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port, host: process.env.HOST ?? '127.0.0.1' });
  app.log.info(
    { port, mode: demoMode ? 'demo' : 'live', repository: repository.kind },
    'aerospace-rwa-api listening',
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
