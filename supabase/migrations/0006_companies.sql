-- Migration 0006: Companies profiles (name-based join)

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),

  name text not null unique,

  notes text not null default '',
  tags text[] not null default '{}'::text[],

  website text not null default '',
  linkedin text not null default '',

  billing_email text not null default '',
  billing_address text not null default '',
  vat_number text not null default '',

  contacts_json jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists companies_name_idx on public.companies(name);

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

alter table public.companies enable row level security;

