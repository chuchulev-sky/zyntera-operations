-- Migration 0003: Offers + Commitments (Projects) for Zyntera Ops
-- Add new tables alongside legacy `web_projects` and `marketing_clients`.

-- Offers: pre-commit estimation engine objects
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),

  client_name text not null,
  company_name text not null,
  project_name text not null,
  category text not null, -- 'Website' | 'Marketing'
  complexity text not null, -- 'Low' | 'Medium' | 'High' | 'Preliminary' | 'Custom'

  notes text not null default '',

  selected_services_json jsonb not null default '[]'::jsonb,

  -- Derived/snapshotted estimates (computed by app)
  estimated_hours_total numeric not null default 0,
  estimated_timeline_days integer not null default 0,
  suggested_price numeric not null default 0,
  currency text not null default 'EUR',
  workload_by_department_json jsonb not null default '{}'::jsonb,

  status text not null default 'Draft', -- 'Draft' | 'Sent' | 'Accepted'
  is_archived boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists offers_category_idx on public.offers(category);
create index if not exists offers_status_idx on public.offers(status);
create index if not exists offers_is_archived_idx on public.offers(is_archived);
create index if not exists offers_updated_at_idx on public.offers(updated_at);

alter table public.offers
  add constraint offers_category_check check (category in ('Website','Marketing'));

alter table public.offers
  add constraint offers_complexity_check check (complexity in ('Low','Medium','High','Preliminary','Custom'));

alter table public.offers
  add constraint offers_status_check check (status in ('Draft','Sent','Accepted'));

drop trigger if exists offers_set_updated_at on public.offers;
create trigger offers_set_updated_at
before update on public.offers
for each row execute function public.set_updated_at();

alter table public.offers enable row level security;

-- Commitments: approved work we have taken on (not task management)
create table if not exists public.commitment_projects (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references public.offers(id) on delete set null,

  client_name text not null,
  company_name text not null,
  project_name text not null,
  category text not null, -- 'Website' | 'Marketing'

  selected_services_json jsonb not null default '[]'::jsonb,

  owner text not null default 'Team', -- 'Peter' | 'Krasi' | 'Team'

  estimated_hours_total numeric not null default 0,
  committed_hours_total numeric not null default 0,

  progress integer not null default 0, -- 0..100
  workload_status text not null default 'Healthy', -- 'Healthy' | 'AtRisk' | 'Overloaded'

  price_total numeric not null default 0,
  currency text not null default 'EUR',
  payment_status text not null default 'Unpaid', -- 'Unpaid' | 'Partial' | 'Paid'
  invoiced_amount numeric not null default 0,
  paid_amount numeric not null default 0,

  notes text not null default '',

  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists commitment_projects_category_idx on public.commitment_projects(category);
create index if not exists commitment_projects_owner_idx on public.commitment_projects(owner);
create index if not exists commitment_projects_payment_status_idx on public.commitment_projects(payment_status);
create index if not exists commitment_projects_workload_status_idx on public.commitment_projects(workload_status);
create index if not exists commitment_projects_is_archived_idx on public.commitment_projects(is_archived);
create index if not exists commitment_projects_updated_at_idx on public.commitment_projects(updated_at);

alter table public.commitment_projects
  add constraint commitment_projects_category_check check (category in ('Website','Marketing'));

alter table public.commitment_projects
  add constraint commitment_projects_owner_check check (owner in ('Peter','Krasi','Team'));

alter table public.commitment_projects
  add constraint commitment_projects_progress_check check (progress >= 0 and progress <= 100);

alter table public.commitment_projects
  add constraint commitment_projects_workload_status_check check (workload_status in ('Healthy','AtRisk','Overloaded'));

alter table public.commitment_projects
  add constraint commitment_projects_payment_status_check check (payment_status in ('Unpaid','Partial','Paid'));

drop trigger if exists commitment_projects_set_updated_at on public.commitment_projects;
create trigger commitment_projects_set_updated_at
before update on public.commitment_projects
for each row execute function public.set_updated_at();

alter table public.commitment_projects enable row level security;

