-- Phase 2+ core application schema for the Volunteer Management System.
-- Additive only. Existing volunteers, events, and attendance rows are preserved.
-- Depends on 202609180001_foundation_roles_helpers.sql.

create extension if not exists pgcrypto;

alter table public.events
  add column if not exists updated_at timestamptz,
  add column if not exists task_requirements text,
  add column if not exists skills_required text[],
  add column if not exists volunteer_slots integer,
  add column if not exists registration_opens_at timestamptz,
  add column if not exists registration_closes_at timestamptz,
  add column if not exists coordinator_name text,
  add column if not exists coordinator_contact text,
  add column if not exists instructions text,
  add column if not exists certificate_title text,
  add column if not exists certificate_threshold_minutes integer default 0;

alter table public.attendance
  add column if not exists updated_at timestamptz,
  add column if not exists checked_in_by uuid references auth.users(id) on delete set null,
  add column if not exists checked_out_by uuid references auth.users(id) on delete set null,
  add column if not exists check_in_method text,
  add column if not exists check_out_method text,
  add column if not exists offline_sync_id text,
  add column if not exists notes text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'events_volunteer_slots_positive') then
    alter table public.events
      add constraint events_volunteer_slots_positive
      check (volunteer_slots is null or volunteer_slots >= 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'events_certificate_threshold_non_negative') then
    alter table public.events
      add constraint events_certificate_threshold_non_negative
      check (certificate_threshold_minutes >= 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'events_registration_window_valid') then
    alter table public.events
      add constraint events_registration_window_valid
      check (
        registration_opens_at is null
        or registration_closes_at is null
        or registration_closes_at >= registration_opens_at
      ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'attendance_checkout_after_checkin') then
    alter table public.attendance
      add constraint attendance_checkout_after_checkin
      check (check_out is null or check_in is null or check_out >= check_in) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'attendance_status_check') then
    alter table public.attendance
      add constraint attendance_status_check
      check (status in ('present', 'absent', 'late')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'attendance_check_in_method_check') then
    alter table public.attendance
      add constraint attendance_check_in_method_check
      check (check_in_method is null or check_in_method in ('manual', 'event_qr', 'volunteer_qr', 'offline_sync')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'attendance_check_out_method_check') then
    alter table public.attendance
      add constraint attendance_check_out_method_check
      check (check_out_method is null or check_out_method in ('manual', 'event_qr', 'volunteer_qr', 'offline_sync')) not valid;
  end if;
end;
$$;

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  volunteer_id uuid not null references public.volunteers(id) on delete cascade,
  status text not null default 'pending',
  registered_at timestamptz not null default now(),
  updated_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  notes text,
  constraint event_registrations_status_check check (
    status in ('pending', 'approved', 'rejected', 'cancelled', 'waitlisted')
  ),
  constraint event_registrations_event_volunteer_key unique (event_id, volunteer_id)
);

create or replace function public.enforce_event_registration_capacity()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  max_slots integer;
  approved_count integer;
begin
  if new.status <> 'approved' then
    return new;
  end if;

  select e.volunteer_slots
  into max_slots
  from public.events e
  where e.id = new.event_id
  for update;

  if max_slots is null then
    return new;
  end if;

  select count(*)
  into approved_count
  from public.event_registrations er
  where er.event_id = new.event_id
    and er.status = 'approved'
    and er.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if approved_count >= max_slots then
    raise exception 'Event volunteer capacity has been reached';
  end if;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'enforce_event_registration_capacity'
      and tgrelid = 'public.event_registrations'::regclass
  ) then
    create trigger enforce_event_registration_capacity
    before insert or update of status, event_id on public.event_registrations
    for each row execute function public.enforce_event_registration_capacity();
  end if;
end;
$$;

create table if not exists public.event_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  description text,
  skills_required text[],
  slots integer,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint event_tasks_slots_positive check (slots is null or slots >= 0),
  constraint event_tasks_time_order_check check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table if not exists public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.event_tasks(id) on delete cascade,
  volunteer_id uuid not null references public.volunteers(id) on delete cascade,
  registration_id uuid references public.event_registrations(id) on delete set null,
  status text not null default 'assigned',
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint task_assignments_status_check check (
    status in ('assigned', 'accepted', 'declined', 'completed', 'cancelled')
  ),
  constraint task_assignments_task_volunteer_key unique (task_id, volunteer_id)
);

create table if not exists public.volunteer_qr_tokens (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteers(id) on delete cascade,
  token_hash text not null unique,
  label text,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint volunteer_qr_tokens_token_hash_length check (char_length(token_hash) >= 32)
);

create table if not exists public.event_qr_tokens (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  token_hash text not null unique,
  purpose text not null default 'check_in',
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint event_qr_tokens_purpose_check check (purpose in ('check_in', 'check_out', 'attendance')),
  constraint event_qr_tokens_time_window_check check (expires_at > starts_at),
  constraint event_qr_tokens_token_hash_length check (char_length(token_hash) >= 32)
);

create table if not exists public.attendance_scan_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  volunteer_id uuid references public.volunteers(id) on delete set null,
  attendance_id uuid references public.attendance(id) on delete set null,
  action text not null,
  scan_source text not null,
  token_id uuid,
  scanned_by uuid references auth.users(id) on delete set null,
  offline_sync_id text,
  result text not null,
  message text,
  created_at timestamptz not null default now(),
  constraint attendance_scan_logs_action_check check (action in ('check_in', 'check_out')),
  constraint attendance_scan_logs_scan_source_check check (scan_source in ('event_qr', 'volunteer_qr', 'manual', 'offline_sync')),
  constraint attendance_scan_logs_result_check check (result in ('success', 'duplicate', 'ineligible', 'expired', 'invalid', 'error'))
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_id text not null unique,
  volunteer_id uuid not null references public.volunteers(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  attendance_id uuid references public.attendance(id) on delete set null,
  title text not null,
  organization_name text not null default 'Alkhidmat Karachi',
  volunteer_name text not null,
  event_name text not null,
  event_date date,
  hours numeric(8, 2) not null default 0,
  issued_at timestamptz not null default now(),
  issued_by uuid references auth.users(id) on delete set null,
  verification_code text not null unique,
  pdf_storage_path text,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  revoke_reason text,
  metadata jsonb not null default '{}'::jsonb,
  constraint certificates_hours_non_negative check (hours >= 0),
  constraint certificates_event_volunteer_key unique (event_id, volunteer_id)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  title text not null,
  body text not null,
  audience text not null default 'all_volunteers',
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint announcements_audience_check check (
    audience in ('public', 'all_volunteers', 'registered_volunteers', 'approved_volunteers', 'admins')
  )
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  parent_message_id uuid references public.messages(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  volunteer_id uuid references public.volunteers(id) on delete set null,
  body text not null,
  visibility text not null default 'event',
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  deleted_at timestamptz,
  constraint messages_visibility_check check (visibility in ('event', 'admin_only'))
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  volunteer_id uuid references public.volunteers(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_target_check check (user_id is not null or volunteer_id is not null)
);

create or replace function public.mark_notification_read(notification uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notifications n
  set read_at = coalesce(n.read_at, now())
  where n.id = notification
    and (
      n.user_id = auth.uid()
      or n.volunteer_id = public.current_volunteer_id()
    );
end;
$$;

create or replace function public.mark_all_notifications_read()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notifications n
  set read_at = coalesce(n.read_at, now())
  where n.read_at is null
    and (
      n.user_id = auth.uid()
      or n.volunteer_id = public.current_volunteer_id()
    );
end;
$$;

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  criteria jsonb not null default '{}'::jsonb,
  icon_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.volunteer_badges (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteers(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  awarded_by uuid references auth.users(id) on delete set null,
  evidence jsonb not null default '{}'::jsonb,
  constraint volunteer_badges_volunteer_badge_key unique (volunteer_id, badge_id)
);

create index if not exists event_registrations_event_id_idx on public.event_registrations(event_id);
create index if not exists event_registrations_volunteer_id_idx on public.event_registrations(volunteer_id);
create index if not exists event_registrations_status_idx on public.event_registrations(status);
create index if not exists event_tasks_event_id_idx on public.event_tasks(event_id);
create index if not exists task_assignments_task_id_idx on public.task_assignments(task_id);
create index if not exists task_assignments_volunteer_id_idx on public.task_assignments(volunteer_id);
create index if not exists volunteer_qr_tokens_volunteer_id_idx on public.volunteer_qr_tokens(volunteer_id);
create index if not exists event_qr_tokens_event_id_idx on public.event_qr_tokens(event_id);
create index if not exists event_qr_tokens_expires_at_idx on public.event_qr_tokens(expires_at);
create index if not exists attendance_scan_logs_event_id_idx on public.attendance_scan_logs(event_id);
create index if not exists attendance_scan_logs_volunteer_id_idx on public.attendance_scan_logs(volunteer_id);
create index if not exists attendance_scan_logs_offline_sync_id_idx on public.attendance_scan_logs(offline_sync_id);
create index if not exists attendance_offline_sync_id_idx on public.attendance(offline_sync_id);
create index if not exists certificates_volunteer_id_idx on public.certificates(volunteer_id);
create index if not exists certificates_event_id_idx on public.certificates(event_id);
create index if not exists certificates_verification_code_idx on public.certificates(verification_code);
create index if not exists announcements_event_id_idx on public.announcements(event_id);
create index if not exists announcements_published_at_idx on public.announcements(published_at);
create index if not exists messages_event_id_idx on public.messages(event_id);
create index if not exists messages_parent_message_id_idx on public.messages(parent_message_id);
create index if not exists messages_sender_user_id_idx on public.messages(sender_user_id);
create index if not exists notifications_user_id_read_at_idx on public.notifications(user_id, read_at);
create index if not exists notifications_volunteer_id_read_at_idx on public.notifications(volunteer_id, read_at);
create index if not exists volunteer_badges_volunteer_id_idx on public.volunteer_badges(volunteer_id);
create index if not exists volunteer_badges_badge_id_idx on public.volunteer_badges(badge_id);

do $$
declare
  target_table regclass;
  trigger_name text;
begin
  foreach target_table in array array[
    'public.events'::regclass,
    'public.attendance'::regclass,
    'public.event_registrations'::regclass,
    'public.event_tasks'::regclass,
    'public.task_assignments'::regclass,
    'public.announcements'::regclass,
    'public.messages'::regclass
  ]
  loop
    trigger_name := 'set_' || replace(target_table::text, '.', '_') || '_updated_at';
    if not exists (
      select 1 from pg_trigger
      where tgname = trigger_name
        and tgrelid = target_table
    ) then
      execute format(
        'create trigger %I before update on %s for each row execute function public.set_updated_at()',
        trigger_name,
        target_table
      );
    end if;
  end loop;
end;
$$;

create or replace function public.attendance_minutes(check_in_at timestamptz, check_out_at timestamptz)
returns integer
language sql
immutable
as $$
  select case
    when check_in_at is null or check_out_at is null or check_out_at < check_in_at then 0
    else floor(extract(epoch from (check_out_at - check_in_at)) / 60)::integer
  end;
$$;

create or replace function public.can_access_event_discussion(target_event_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.has_app_role(array['admin', 'coordinator', 'ngo_admin'])
    or exists (
      select 1
      from public.event_registrations er
      where er.event_id = target_event_id
        and er.volunteer_id = public.current_volunteer_id()
        and er.status in ('pending', 'approved', 'waitlisted')
    );
$$;

create or replace view public.volunteer_impact_summary
with (security_invoker = true)
as
select
  v.id as volunteer_id,
  count(distinct er.event_id) filter (where er.status in ('pending', 'approved', 'waitlisted')) as events_registered,
  count(distinct a.event_id) filter (where a.status in ('present', 'late')) as events_attended,
  coalesce(sum(public.attendance_minutes(a.check_in, a.check_out)), 0) as total_minutes,
  round(coalesce(sum(public.attendance_minutes(a.check_in, a.check_out)), 0)::numeric / 60, 2) as total_hours,
  count(distinct c.id) filter (where c.revoked_at is null) as certificates_earned,
  count(distinct vb.id) as badges_earned
from public.volunteers v
left join public.event_registrations er on er.volunteer_id = v.id
left join public.attendance a on a.volunteer_id = v.id
left join public.certificates c on c.volunteer_id = v.id
left join public.volunteer_badges vb on vb.volunteer_id = v.id
group by v.id;

create or replace view public.event_participation_summary
with (security_invoker = true)
as
select
  e.id as event_id,
  count(distinct er.id) as total_registrations,
  count(distinct er.id) filter (where er.status = 'approved') as approved_registrations,
  count(distinct er.id) filter (where er.status = 'waitlisted') as waitlisted_registrations,
  count(distinct a.id) filter (where a.status in ('present', 'late')) as attended_count,
  coalesce(sum(public.attendance_minutes(a.check_in, a.check_out)), 0) as total_minutes,
  round(coalesce(sum(public.attendance_minutes(a.check_in, a.check_out)), 0)::numeric / 60, 2) as total_hours,
  greatest(coalesce(e.volunteer_slots, 0) - count(distinct er.id) filter (where er.status = 'approved'), 0) as available_slots
from public.events e
left join public.event_registrations er on er.event_id = e.id
left join public.attendance a on a.event_id = e.id
group by e.id, e.volunteer_slots;
