-- Migration 0004: commitment project origin

alter table public.commitment_projects
  add column if not exists origin text not null default 'Manual';

alter table public.commitment_projects
  add constraint commitment_projects_origin_check
    check (origin in ('Manual','From Offer'));

create index if not exists commitment_projects_origin_idx on public.commitment_projects(origin);

