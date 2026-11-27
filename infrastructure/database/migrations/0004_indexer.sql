create table if not exists indexer_cursors (
  stream text primary key,
  cursor bigint not null,
  updated_at timestamptz not null default now()
);

create table if not exists processed_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);
