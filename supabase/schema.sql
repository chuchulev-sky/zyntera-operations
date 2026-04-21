-- Zyntera Ops (Supabase Postgres) schema
-- Run this in Supabase SQL Editor.

-- Extensions
create extension if not exists "pgcrypto";

-- Enums (optional: keep as text for flexibility)
-- We keep as text with CHECK constraints for easier iteration.

-- Websites: one-time projects
create table if not exists public.web_projects (
  id uuid primary key default gen_random_uuid(),

  client_name text not null,
  company_name text not null,
  project_name text not null,
  project_type text not null,
  source_owner text not null,

  status text not null,
  priority text not null,

  start_date date not null,
  target_end_date date not null,

  notes text not null default '',
  blocked_reason text,

  checklist_json jsonb not null default '{}'::jsonb,

  proposal_amount numeric not null default 0,
  agreed_amount numeric not null default 0,
  invoiced_amount numeric not null default 0,
  paid_amount numeric not null default 0,
  currency text not null default 'EUR',
  payment_status text not null default 'Unpaid',

  sort_index integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists web_projects_status_idx on public.web_projects(status);
create index if not exists web_projects_start_date_idx on public.web_projects(start_date);
create index if not exists web_projects_updated_at_idx on public.web_projects(updated_at);

alter table public.web_projects
  add constraint web_projects_source_owner_check
    check (source_owner in ('Peter','Krasi','Team'));

alter table public.web_projects
  add constraint web_projects_status_check
    check (status in ('Lead','Proposal Sent','Won','Scheduled','In Progress','Waiting for Client','Blocked','Completed','Cancelled'));

alter table public.web_projects
  add constraint web_projects_payment_status_check
    check (payment_status in ('Unpaid','Partial','Paid'));

-- Notes/activity for website projects
create table if not exists public.web_project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.web_projects(id) on delete cascade,
  author text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists web_project_notes_project_id_idx on public.web_project_notes(project_id);

-- Marketing: retainers (clients)
create table if not exists public.marketing_clients (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  services text[] not null default '{}'::text[],
  monthly_fee numeric not null default 0,
  net_amount numeric not null default 0,
  creatives_per_month integer not null default 0,
  owner text not null default 'Team',
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_clients_status_idx on public.marketing_clients(status);

alter table public.marketing_clients
  add constraint marketing_clients_owner_check
    check (owner in ('Peter','Krasi','Team'));

alter table public.marketing_clients
  add constraint marketing_clients_status_check
    check (status in ('Active','Paused'));

-- Marketing: monthly records
create table if not exists public.marketing_monthly_records (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.marketing_clients(id) on delete cascade,
  month_key text not null, -- YYYY-MM
  paid boolean not null default false,
  payment_status text not null default 'Unpaid',
  notes text not null default '',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, month_key)
);

create index if not exists marketing_monthly_records_client_id_idx on public.marketing_monthly_records(client_id);
create index if not exists marketing_monthly_records_month_idx on public.marketing_monthly_records(month_key);

alter table public.marketing_monthly_records
  add constraint marketing_monthly_records_payment_status_check
    check (payment_status in ('Paid','Unpaid','Late'));

-- updated_at triggers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists web_projects_set_updated_at on public.web_projects;
create trigger web_projects_set_updated_at
before update on public.web_projects
for each row execute function public.set_updated_at();

drop trigger if exists marketing_clients_set_updated_at on public.marketing_clients;
create trigger marketing_clients_set_updated_at
before update on public.marketing_clients
for each row execute function public.set_updated_at();

drop trigger if exists marketing_monthly_records_set_updated_at on public.marketing_monthly_records;
create trigger marketing_monthly_records_set_updated_at
before update on public.marketing_monthly_records
for each row execute function public.set_updated_at();

-- RLS: enabled, but without auth we recommend restricting access via service role only.
alter table public.web_projects enable row level security;
alter table public.web_project_notes enable row level security;
alter table public.marketing_clients enable row level security;
alter table public.marketing_monthly_records enable row level security;

-- No policies by default (deny all). Access via service role key on server.

