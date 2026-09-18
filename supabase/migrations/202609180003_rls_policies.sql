-- RLS policies for Volunteer Management System tables.
-- Review carefully against existing Supabase policies before applying.
-- Policies are additive and use unique vms_* names.

alter table public.user_roles enable row level security;
alter table public.volunteers enable row level security;
alter table public.events enable row level security;
alter table public.attendance enable row level security;
alter table public.event_registrations enable row level security;
alter table public.event_tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.volunteer_qr_tokens enable row level security;
alter table public.event_qr_tokens enable row level security;
alter table public.attendance_scan_logs enable row level security;
alter table public.certificates enable row level security;
alter table public.announcements enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.badges enable row level security;
alter table public.volunteer_badges enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_roles' and policyname = 'vms_user_roles_select_own_or_admin') then
    create policy vms_user_roles_select_own_or_admin
      on public.user_roles for select
      using (user_id = auth.uid() or public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_roles' and policyname = 'vms_user_roles_admin_manage') then
    create policy vms_user_roles_admin_manage
      on public.user_roles for all
      using (public.has_app_role(array['admin', 'ngo_admin']))
      with check (public.has_app_role(array['admin', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'volunteers' and policyname = 'vms_volunteers_select_own_or_admin') then
    create policy vms_volunteers_select_own_or_admin
      on public.volunteers for select
      using (auth_user_id = auth.uid() or public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'volunteers' and policyname = 'vms_volunteers_insert_own') then
    create policy vms_volunteers_insert_own
      on public.volunteers for insert
      with check (auth_user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'volunteers' and policyname = 'vms_volunteers_update_own_or_admin') then
    create policy vms_volunteers_update_own_or_admin
      on public.volunteers for update
      using (auth_user_id = auth.uid() or public.has_app_role(array['admin', 'coordinator', 'ngo_admin']))
      with check (auth_user_id = auth.uid() or public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'vms_events_authenticated_read_visible') then
    create policy vms_events_authenticated_read_visible
      on public.events for select
      using (auth.uid() is not null and status in ('upcoming', 'ongoing'));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'vms_events_admin_manage') then
    create policy vms_events_admin_manage
      on public.events for all
      using (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']))
      with check (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'event_registrations' and policyname = 'vms_event_registrations_select_own_or_admin') then
    create policy vms_event_registrations_select_own_or_admin
      on public.event_registrations for select
      using (public.is_current_volunteer(volunteer_id) or public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'event_registrations' and policyname = 'vms_event_registrations_insert_own_pending') then
    create policy vms_event_registrations_insert_own_pending
      on public.event_registrations for insert
      with check (
        public.is_current_volunteer(volunteer_id)
        and status = 'pending'
        and exists (
          select 1 from public.events e
          where e.id = event_id
            and e.status in ('upcoming', 'ongoing')
            and (e.registration_opens_at is null or e.registration_opens_at <= now())
            and (e.registration_closes_at is null or e.registration_closes_at >= now())
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'event_registrations' and policyname = 'vms_event_registrations_admin_manage') then
    create policy vms_event_registrations_admin_manage
      on public.event_registrations for all
      using (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']))
      with check (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'event_tasks' and policyname = 'vms_event_tasks_select_visible') then
    create policy vms_event_tasks_select_visible
      on public.event_tasks for select
      using (
        public.has_app_role(array['admin', 'coordinator', 'ngo_admin'])
        or (
          auth.uid() is not null
          and exists (
            select 1 from public.events e
            where e.id = event_id
              and e.status in ('upcoming', 'ongoing')
          )
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'event_tasks' and policyname = 'vms_event_tasks_admin_manage') then
    create policy vms_event_tasks_admin_manage
      on public.event_tasks for all
      using (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']))
      with check (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'task_assignments' and policyname = 'vms_task_assignments_select_own_or_admin') then
    create policy vms_task_assignments_select_own_or_admin
      on public.task_assignments for select
      using (public.is_current_volunteer(volunteer_id) or public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'task_assignments' and policyname = 'vms_task_assignments_admin_manage') then
    create policy vms_task_assignments_admin_manage
      on public.task_assignments for all
      using (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']))
      with check (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'attendance' and policyname = 'vms_attendance_select_own_or_admin') then
    create policy vms_attendance_select_own_or_admin
      on public.attendance for select
      using (public.is_current_volunteer(volunteer_id) or public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'attendance' and policyname = 'vms_attendance_admin_manage') then
    create policy vms_attendance_admin_manage
      on public.attendance for all
      using (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']))
      with check (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'volunteer_qr_tokens' and policyname = 'vms_volunteer_qr_tokens_admin_insert') then
    create policy vms_volunteer_qr_tokens_admin_insert
      on public.volunteer_qr_tokens for insert
      with check (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'volunteer_qr_tokens' and policyname = 'vms_volunteer_qr_tokens_admin_update') then
    create policy vms_volunteer_qr_tokens_admin_update
      on public.volunteer_qr_tokens for update
      using (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']))
      with check (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'volunteer_qr_tokens' and policyname = 'vms_volunteer_qr_tokens_admin_delete') then
    create policy vms_volunteer_qr_tokens_admin_delete
      on public.volunteer_qr_tokens for delete
      using (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'event_qr_tokens' and policyname = 'vms_event_qr_tokens_admin_insert') then
    create policy vms_event_qr_tokens_admin_insert
      on public.event_qr_tokens for insert
      with check (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'event_qr_tokens' and policyname = 'vms_event_qr_tokens_admin_update') then
    create policy vms_event_qr_tokens_admin_update
      on public.event_qr_tokens for update
      using (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']))
      with check (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'event_qr_tokens' and policyname = 'vms_event_qr_tokens_admin_delete') then
    create policy vms_event_qr_tokens_admin_delete
      on public.event_qr_tokens for delete
      using (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'attendance_scan_logs' and policyname = 'vms_attendance_scan_logs_select_own_or_admin') then
    create policy vms_attendance_scan_logs_select_own_or_admin
      on public.attendance_scan_logs for select
      using (public.is_current_volunteer(volunteer_id) or public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'attendance_scan_logs' and policyname = 'vms_attendance_scan_logs_admin_insert') then
    create policy vms_attendance_scan_logs_admin_insert
      on public.attendance_scan_logs for insert
      with check (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'certificates' and policyname = 'vms_certificates_select_own_or_admin') then
    create policy vms_certificates_select_own_or_admin
      on public.certificates for select
      using (public.is_current_volunteer(volunteer_id) or public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'certificates' and policyname = 'vms_certificates_admin_manage') then
    create policy vms_certificates_admin_manage
      on public.certificates for all
      using (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']))
      with check (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'announcements' and policyname = 'vms_announcements_select_authorized') then
    create policy vms_announcements_select_authorized
      on public.announcements for select
      using (
        public.has_app_role(array['admin', 'coordinator', 'ngo_admin'])
        or (
          auth.uid() is not null
          and
          audience = 'public'
          and published_at is not null
          and published_at <= now()
        )
        or (
          auth.uid() is not null
          and audience = 'all_volunteers'
          and published_at is not null
          and published_at <= now()
          and exists (select 1 from public.volunteers v where v.auth_user_id = auth.uid())
        )
        or (
          event_id is not null
          and audience in ('registered_volunteers', 'approved_volunteers')
          and published_at is not null
          and published_at <= now()
          and exists (
            select 1 from public.event_registrations er
            where er.event_id = announcements.event_id
              and er.volunteer_id = public.current_volunteer_id()
              and (
                (announcements.audience = 'registered_volunteers' and er.status in ('pending', 'approved', 'waitlisted'))
                or (announcements.audience = 'approved_volunteers' and er.status = 'approved')
              )
          )
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'announcements' and policyname = 'vms_announcements_admin_manage') then
    create policy vms_announcements_admin_manage
      on public.announcements for all
      using (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']))
      with check (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'messages' and policyname = 'vms_messages_select_authorized') then
    create policy vms_messages_select_authorized
      on public.messages for select
      using (
        sender_user_id = auth.uid()
        or public.has_app_role(array['admin', 'coordinator', 'ngo_admin'])
        or (event_id is not null and public.can_access_event_discussion(event_id) and visibility = 'event' and deleted_at is null)
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'messages' and policyname = 'vms_messages_insert_authorized') then
    create policy vms_messages_insert_authorized
      on public.messages for insert
      with check (
        sender_user_id = auth.uid()
        and (
          public.has_app_role(array['admin', 'coordinator', 'ngo_admin'])
          or (
            event_id is not null
            and public.can_access_event_discussion(event_id)
            and visibility = 'event'
            and (volunteer_id is null or volunteer_id = public.current_volunteer_id())
          )
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'messages' and policyname = 'vms_messages_admin_manage') then
    create policy vms_messages_admin_manage
      on public.messages for all
      using (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']))
      with check (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'vms_notifications_select_own') then
    create policy vms_notifications_select_own
      on public.notifications for select
      using (
        user_id = auth.uid()
        or (volunteer_id = public.current_volunteer_id())
        or public.has_app_role(array['admin', 'coordinator', 'ngo_admin'])
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'vms_notifications_admin_manage') then
    create policy vms_notifications_admin_manage
      on public.notifications for all
      using (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']))
      with check (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'badges' and policyname = 'vms_badges_select_active') then
    create policy vms_badges_select_active
      on public.badges for select
      using ((auth.uid() is not null and is_active = true) or public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'badges' and policyname = 'vms_badges_admin_manage') then
    create policy vms_badges_admin_manage
      on public.badges for all
      using (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']))
      with check (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'volunteer_badges' and policyname = 'vms_volunteer_badges_select_own_or_admin') then
    create policy vms_volunteer_badges_select_own_or_admin
      on public.volunteer_badges for select
      using (public.is_current_volunteer(volunteer_id) or public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'volunteer_badges' and policyname = 'vms_volunteer_badges_admin_manage') then
    create policy vms_volunteer_badges_admin_manage
      on public.volunteer_badges for all
      using (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']))
      with check (public.has_app_role(array['admin', 'coordinator', 'ngo_admin']));
  end if;
end;
$$;
