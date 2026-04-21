-- Migration 0005: Expand commitment project payment statuses
-- Allow marketing monthly billing types (Retainer / Subscription) in addition to existing statuses.

alter table public.commitment_projects
  drop constraint if exists commitment_projects_payment_status_check;

alter table public.commitment_projects
  add constraint commitment_projects_payment_status_check
    check (payment_status in ('Retainer','Subscription','Unpaid','Partial','Paid'));

