import { Pool } from 'pg';
import { demoSnapshot } from '@aerospace/shared-types';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://aerospace:aerospace@localhost:5432/aerospace_rwa';

async function main() {
  if (process.env.DEMO_SEED !== 'true') {
    throw new Error(
      'Refusing to seed synthetic demo records without DEMO_SEED=true. Seed data is illustrative and must never be presented as production data.',
    );
  }

  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();
  try {
    await client.query('begin');

    for (const asset of demoSnapshot.assets) {
      await client.query(
        `insert into assets (id, slug, registry_id, vertical, status, payload, updated_at)
         values ($1, $2, $3, $4, $5, $6, now())
         on conflict (id) do update set
           slug = excluded.slug,
           registry_id = excluded.registry_id,
           vertical = excluded.vertical,
           status = excluded.status,
           payload = excluded.payload,
           updated_at = now()`,
        [asset.id, asset.slug, asset.registryId, asset.vertical, asset.status, asset],
      );
    }

    await client.query(
      `insert into investors (id, payload, updated_at)
       values ($1, $2, now())
       on conflict (id) do update set payload = excluded.payload, updated_at = now()`,
      [demoSnapshot.investor.id, demoSnapshot.investor],
    );

    for (const distribution of demoSnapshot.distributions) {
      await client.query(
        `insert into distributions (id, pay_date, payload, updated_at)
         values ($1, $2, $3, now())
         on conflict (id) do update set
           pay_date = excluded.pay_date,
           payload = excluded.payload,
           updated_at = now()`,
        [distribution.id, distribution.payDate, distribution],
      );
    }

    for (const item of demoSnapshot.compliance) {
      await client.query(
        `insert into compliance_cases (id, status, submitted_at, payload, updated_at)
         values ($1, $2, $3, $4, now())
         on conflict (id) do update set
           status = excluded.status,
           submitted_at = excluded.submitted_at,
           payload = excluded.payload,
           updated_at = now()`,
        [item.id, item.status, item.submittedAt, item],
      );
    }

    for (const task of demoSnapshot.tasks) {
      await client.query(
        `insert into operations_tasks (id, due_date, payload, updated_at)
         values ($1, $2, $3, now())
         on conflict (id) do update set
           due_date = excluded.due_date,
           payload = excluded.payload,
           updated_at = now()`,
        [task.id, task.dueDate, task],
      );
    }

    await client.query(
      `insert into platform_metrics (id, payload, updated_at)
       values ('current', $1, now())
       on conflict (id) do update set payload = excluded.payload, updated_at = now()`,
      [demoSnapshot.metrics],
    );

    const sections: Array<[string, unknown]> = [
      ['leases', demoSnapshot.leases],
      ['maintenance', demoSnapshot.maintenance],
      ['insurance', demoSnapshot.insurance],
      ['oracles', demoSnapshot.oracles],
      ['activity', demoSnapshot.activity],
      ['protocol', demoSnapshot.protocol],
    ];
    for (const [id, payload] of sections) {
      await client.query(
        `insert into platform_sections (id, payload, updated_at)
         values ($1, $2, now())
         on conflict (id) do update set payload = excluded.payload, updated_at = now()`,
        [id, payload],
      );
    }

    await client.query('commit');
    console.log(
      `[db:seed] inserted illustrative demo data: ${demoSnapshot.assets.length} assets, ${demoSnapshot.compliance.length} compliance cases, ${demoSnapshot.tasks.length} operations tasks.`,
    );
    console.log(
      '[db:seed] Every seeded record is synthetic and must remain labelled as demo data.',
    );
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[db:seed] failed:', error);
  process.exit(1);
});
