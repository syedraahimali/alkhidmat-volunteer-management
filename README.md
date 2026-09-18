# Alkhidmat Karachi Volunteer Management System

Production-focused volunteer management web application for Alkhidmat Karachi. The system is being built in phases on Next.js, TypeScript, Tailwind CSS, Supabase PostgreSQL, and Supabase Auth.

## Phase 1 status

- Next.js App Router project scaffolded.
- Tailwind CSS design foundation added.
- Supabase browser, server, middleware, and optional service-role clients added.
- Signup, login, forgot password, reset password, logout, auth callback, and protected routes added.
- Volunteer and admin dashboard shells added.
- Additive Phase 1 migration created for roles, profile linking, helper functions, indexes, and RLS policies.
- Live database changes have not been applied because credentials/DB connection are not present locally.

## Tech stack

- Next.js with TypeScript and App Router
- Tailwind CSS
- Supabase PostgreSQL and Supabase Auth
- React Server Components and Server Actions
- Zod validation
- QR/PDF/chart dependencies installed for later phases

## Environment variables

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://kjgjdovjqedbeyabyljh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=optional-server-only-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Never commit `.env.local`. The generated `.gitignore` excludes `.env*`.

## Database safety

The existing Supabase database is not reset or replaced. Before applying any migration:

1. Run the read-only queries in `supabase/docs/schema-inspection.sql`.
2. Confirm the current columns, constraints, and RLS policies.
3. Review `supabase/migrations/202609180001_phase1_auth_roles.sql`.
4. Apply only after confirming it is compatible with the live schema.

The Phase 1 migration is additive. It creates `user_roles`, helper functions, profile-linking trigger, indexes, and policies while preserving existing `volunteers`, `events`, and `attendance` data.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Folder structure

- `src/app` - App Router pages, auth callback, protected volunteer/admin routes
- `src/components` - shared layout, auth forms, and UI primitives
- `src/lib` - Supabase clients, auth actions/session helpers, validation, types
- `supabase/docs` - read-only schema inspection helpers
- `supabase/migrations` - SQL migrations to review/apply manually

## Roles

Roles live in `public.user_roles`:

- `volunteer`
- `coordinator`
- `admin`
- `ngo_admin`
- `strategic_partner`

Admin routes are protected server-side by role checks. RLS policies must also be applied in Supabase so authorization is enforced by the database, not only the UI.

## Phase roadmap

1. Foundation: app scaffold, Supabase config, auth, roles, protected routes.
2. Public pages, volunteer dashboard, event calendar/details, registration.
3. Admin dashboard, event management, registration approvals, attendance management.
4. QR attendance, digital ID, hours calculation, automated PDF certificates.
5. Notifications, announcements/Q&A, badges, analytics, CSV export.
6. Testing, security/RLS review, responsive review, documentation hardening.
