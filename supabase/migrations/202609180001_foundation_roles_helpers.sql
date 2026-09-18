-- Phase 1 foundation: roles, helper functions, safe profile columns, and indexes.
-- Additive only. Does not delete, merge, or modify existing volunteer/Auth records.
-- Apply only after reviewing the current schema and RLS policies.

create extension if not exists pgcrypto;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'volunteer',
  created_at timestamptz not null default now(),
  constraint user_roles_role_check check (
    role in ('volunteer', 'coordinator', 'admin', 'ngo_admin', 'strategic_partner')
  ),
  constraint user_roles_user_role_key unique (user_id, role)
);

alter table public.volunteers
  add column if not exists avatar_url text,
  add column if not exists updated_at timestamptz;

create index if not exists volunteers_auth_user_id_idx on public.volunteers(auth_user_id);
create index if not exists volunteers_email_lower_idx on public.volunteers(lower(email));
create index if not exists volunteers_status_idx on public.volunteers(status);
create index if not exists events_status_start_time_idx on public.events(status, start_time);
create index if not exists attendance_volunteer_event_idx on public.attendance(volunteer_id, event_id);
create index if not exists user_roles_user_id_idx on public.user_roles(user_id);
create index if not exists user_roles_role_idx on public.user_roles(role);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_volunteers_updated_at'
      and tgrelid = 'public.volunteers'::regclass
  ) then
    create trigger set_volunteers_updated_at
    before update on public.volunteers
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

create or replace function public.has_app_role(required_roles text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = any(required_roles)
  );
$$;

create or replace function public.current_volunteer_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select v.id
  from public.volunteers v
  where v.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_current_volunteer(volunteer uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select volunteer is not null
    and volunteer = public.current_volunteer_id();
$$;

-- Intentionally no automatic auth.users trigger here.
-- Existing 3 unlinked volunteers and 5 unmatched Auth users must be reconciled
-- manually by an authorized admin after identity is confirmed.
