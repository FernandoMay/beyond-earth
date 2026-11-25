create table if not exists offerings (
  id text primary key,
  asset_id text not null,
  status text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists offerings_asset_id_idx on offerings (asset_id);
create index if not exists offerings_status_idx on offerings (status);
