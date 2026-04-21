-- Migration 0008: Commitment project schedule (start/end dates)
-- Enables capacity forecasting by distributing committed hours across a timeline.

alter table public.commitment_projects
  add column if not exists start_date date not null default current_date;

alter table public.commitment_projects
  add column if not exists target_end_date date not null default (current_date + interval '14 days');

create index if not exists commitment_projects_start_date_idx on public.commitment_projects(start_date);
create index if not exists commitment_projects_target_end_date_idx on public.commitment_projects(target_end_date);

