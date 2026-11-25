-- Aerospace RWA — initial PostgreSQL schema.
-- Domain payloads are stored as JSONB so the API can evolve without losing
-- authoritative operational records. Indexed columns support the queries the
-- repository actually runs.

create table if not exists schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists assets (
  id text primary key,
  slug text not null unique,
  registry_id text not null unique,
  vertical text not null check (vertical in ('aviation', 'space', 'manufacturing', 'drones', 'marketplace')),
  status text not null check (status in ('draft', 'evidence_review', 'verified', 'tokenized', 'active', 'suspended', 'retired')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists investors (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists distributions (
  id text primary key,
  pay_date date not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists compliance_cases (
  id text primary key,
  status text not null,
  submitted_at timestamptz not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists operations_tasks (
  id text primary key,
  due_date date not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  offering_id text not null,
  wallet text not null,
  amount jsonb not null,
  status text not null check (status in ('pending_escrow', 'settled', 'cancelled', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists platform_metrics (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

-- Sections that are not independently queried (leases, maintenance, insurance,
-- oracle snapshots, activity, protocol modules) are stored as one payload each.
create table if not exists platform_sections (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists assets_vertical_status_idx on assets (vertical, status);
create index if not exists assets_updated_at_idx on assets (updated_at desc);
create index if not exists compliance_cases_status_idx on compliance_cases (status);
create index if not exists compliance_cases_submitted_at_idx on compliance_cases (submitted_at);
create index if not exists operations_tasks_due_date_idx on operations_tasks (due_date);
create index if not exists distributions_pay_date_idx on distributions (pay_date);
create index if not exists subscriptions_offering_idx on subscriptions (offering_id);
