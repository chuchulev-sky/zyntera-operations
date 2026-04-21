-- Migration 0002: archive + services support for website projects
-- Run in Supabase SQL editor after schema.sql is applied.

alter table public.web_projects
  add column if not exists is_archived boolean not null default false;

create index if not exists web_projects_is_archived_idx on public.web_projects(is_archived);

alter table public.web_projects
  add column if not exists services_json jsonb not null default '[]'::jsonb;

-- Backfill: if services_json empty, derive from existing project_type (best-effort)
update public.web_projects
set services_json = jsonb_build_array(
  jsonb_build_object(
    'name', project_type,
    'category',
      case
        when project_type in ('Facebook Ads','Google Ads','SEO','Social Media Management','Email Marketing') then 'Marketing'
        when project_type in ('UI/UX Design','Branding') then 'Design'
        else 'Web'
      end
  )
)
where (services_json = '[]'::jsonb or services_json is null);

