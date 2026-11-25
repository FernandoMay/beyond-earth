import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://aerospace:aerospace@localhost:5432/aerospace_rwa';
const migrationsDir = resolve(process.cwd(), 'infrastructure/database/migrations');

async function main() {
  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query(`
      create table if not exists schema_migrations (
        version text primary key,
        applied_at timestamptz not null default now()
      )
    `);
    await client.query('commit');

    const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
    for (const file of files) {
      const applied = await client.query('select 1 from schema_migrations where version = $1', [
        file,
      ]);
      if (applied.rowCount) {
        console.log(`[db:migrate] skip ${file} (already applied)`);
        continue;
      }
      const sql = await readFile(join(migrationsDir, file), 'utf8');
      console.log(`[db:migrate] applying ${file}`);
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into schema_migrations (version) values ($1)', [file]);
        await client.query('commit');
      } catch (error) {
        await client.query('rollback');
        throw error;
      }
    }
    console.log('[db:migrate] complete');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[db:migrate] failed:', error);
  process.exit(1);
});
