-- Migration 0007: Allow 'Design' category for offers and commitments

alter table public.offers
  drop constraint if exists offers_category_check;

alter table public.offers
  add constraint offers_category_check check (category in ('Website','Marketing','Design'));

alter table public.commitment_projects
  drop constraint if exists commitment_projects_category_check;

alter table public.commitment_projects
  add constraint commitment_projects_category_check check (category in ('Website','Marketing','Design'));

