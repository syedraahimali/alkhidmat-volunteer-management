import Link from "next/link";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { EventCreateForm } from "@/components/events/event-create-form";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminCreateEventPage() {
  const { user, roles } = await requireAdmin();

  return (
    <AppShell userEmail={user.email} portal="admin" userRoles={roles}>
      <div className="grid gap-6">
        <Link href="/admin/events" className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to event management
        </Link>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-brand">
              <CalendarPlus className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-brand">Event setup</p>
              <h1 className="text-3xl font-semibold text-slate-950">Create New Event</h1>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
            Add event details using the existing event model. Upcoming and ongoing events become visible to volunteers according to the current RLS and status rules.
          </p>
        </section>
        <Card className="p-5 sm:p-6">
          <EventCreateForm />
        </Card>
      </div>
    </AppShell>
  );
}
