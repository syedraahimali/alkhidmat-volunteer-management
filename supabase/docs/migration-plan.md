# Volunteer Management System Migration Plan

Prepared after read-only inspection of the existing Supabase project. Do not apply these migrations until an authorized reviewer confirms the current RLS policies in the Supabase SQL editor.

## Confirmed Existing RLS Policies

The inspected project already contains these policies, which are preserved and are not replaced by the migrations:

- `volunteers`: volunteers can create, update, and view their own profile.
- `events`: authenticated volunteers can view events.
- `attendance`: volunteers can create and view their own attendance.

PostgreSQL permissive policies combine with OR semantics. The new policies therefore add access for explicitly authorized administrative roles but do not attempt to narrow or modify the existing policies.

## Existing Data Preservation

- Existing `volunteers`, `events`, and `attendance` tables are not dropped or recreated.
- Existing rows are preserved.
- Existing attendance relationships are reused.
- No automatic merge/link is performed for the 3 volunteers without `auth_user_id`.
- No automatic profile creation/merge is performed for the 5 Auth users without matching volunteer profiles.

## Migration Files

1. `202609180001_foundation_roles_helpers.sql`
   - Adds `user_roles`.
   - Adds helper functions: `has_app_role`, `current_volunteer_id`, `is_current_volunteer`.
   - Adds safe profile columns to `volunteers`: `avatar_url`, `updated_at`.
   - Adds supporting indexes.

2. `202609180002_core_application_schema.sql`
   - Extends `events` with task/detail/capacity/certificate fields.
   - Extends `attendance` with audit, QR/offline, and method fields.
   - Adds event registration, tasks, assignments, QR token, scan log, certificate, announcement, message, notification, badge, and reporting objects.
   - Adds `volunteer_impact_summary` and `event_participation_summary` views.

3. `202609180003_rls_policies.sql`
   - Enables RLS for new tables.
   - Adds uniquely named `vms_*` policies.
   - Preserves existing policy names and definitions.
   - Keeps event browsing authenticated; it does not add anonymous event access.
   - Restricts volunteers to their own registrations, attendance, certificates, notifications, badges, and task assignments.
   - Allows administrative roles to manage operational records without granting volunteers event-management permissions.
   - Does not create `SELECT` policies for QR token tables, so token hashes remain unavailable through client table reads.

## Safe Reconciliation

Unmatched records should be reconciled manually by an admin-only screen or SQL process after identity verification:

- Match by confirmed email only after checking with the volunteer.
- Update `volunteers.auth_user_id` for the verified volunteer row.
- Insert the correct `user_roles` row.
- Do not delete duplicate-looking records without human review.

## Review Notes

- Existing RLS policies were confirmed by inspection, but run `schema-inspection.sql` again immediately before applying if the project has changed.
- The existing event policy is authenticated-only. Do not add an anonymous event policy unless public event browsing becomes an explicit requirement.
- Volunteer cancellation and task-response workflows should preferably be implemented through server actions/RPC so volunteers cannot update unrelated fields.
- QR token tables store token hashes only. Their lifecycle policies allow authorized server-side operations but intentionally do not allow client `SELECT` access to the hashes.
- The helper functions that inspect `user_roles` are `security definer` functions with a fixed `search_path`, avoiding RLS recursion through the `user_roles` policy.
