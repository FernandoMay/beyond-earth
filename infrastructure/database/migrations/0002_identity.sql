-- Identity and wallet linkage for Sprint 1.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists wallets (
  address text primary key,
  user_id uuid not null references users(id) on delete cascade,
  network text not null default 'testnet',
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null references wallets(address) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists wallets_user_id_idx on wallets (user_id);
create index if not exists sessions_wallet_address_idx on sessions (wallet_address);
