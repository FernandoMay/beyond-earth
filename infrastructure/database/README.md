# Database

PostgreSQL is the operational system of record for the reference API.

```bash
export DATABASE_URL=postgres://aerospace:aerospace@localhost:5432/aerospace_rwa
npm run db:migrate
DEMO_SEED=true npm run db:seed
```

`db:seed` refuses to run without `DEMO_SEED=true` because every seeded asset,
investor, distribution and task is synthetic. Seeded JSON payloads carry
`illustrative: true` and must never be presented as real records.

## Tables

| Table               | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `assets`            | Asset records with indexed vertical/status and JSONB payload    |
| `investors`         | Investor profile payloads                                       |
| `distributions`     | Distribution records with `pay_date`                            |
| `compliance_cases`  | Review queue with status and submission time                    |
| `operations_tasks`  | Lease, maintenance, insurance and inspection tasks              |
| `subscriptions`     | Idempotent subscription intents; status starts `pending_escrow` |
| `platform_metrics`  | Snapshot metrics (`id = 'current'`)                             |
| `platform_sections` | Leases, maintenance, insurance, oracles, activity, protocol     |
| `schema_migrations` | Applied migration filenames                                     |

Migrations are append-only. Add a new numbered file rather than editing an
applied migration.
