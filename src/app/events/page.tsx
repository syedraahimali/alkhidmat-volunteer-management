import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { getUserRoles, requireUser } from "@/lib/auth/session";
import { formatEventDateTime } from "@/lib/events/format";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const user = await requireUser();
  const roles = await getUserRoles(user.id);

  if (!isSupabaseConfigured()) {
    return (
      <AppShell userEmail={user.email} portal="volunteer" userRoles={roles}>
        <Alert>Supabase is not configured yet. Events cannot be loaded.</Alert>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id, event_name, description, location, start_time, end_time, status, volunteer_slots, registration_opens_at, registration_closes_at, skills_required, task_requirements",
    )
    .in("status", ["upcoming", "ongoing"])
    .order("start_time", { ascending: true })
    .limit(50);

  return (
    <AppShell userEmail={user.email} portal="volunteer" userRoles={roles}>
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand">Volunteer opportunities</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Upcoming and ongoing events</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Browse events available to authenticated volunteers and open an event to review its requirements.
            </p>
          </div>
          <Link href="/profile" className="text-sm font-medium text-brand hover:underline">
            Update your profile
          </Link>
        </div>

        {error ? (
          <Alert className="mt-8 border-red-200 bg-red-50 text-red-900">
            We could not load events right now. Please refresh and try again.
          </Alert>
        ) : events?.length ? (
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id} className="flex h-full flex-col p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-brand">{event.status}</span>
                  <span className="text-xs text-slate-500">
                    {event.volunteer_slots === null ? "Flexible capacity" : `${event.volunteer_slots} volunteer slots`}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">{event.event_name || "Untitled event"}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                  {event.description || "Event details will be shared by the coordinator."}
                </p>
                <div className="mt-4 grid gap-2 text-sm text-slate-600">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    {formatEventDateTime(event.start_time)}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {event.location || "Location to be announced"}
                  </span>
                </div>
                <Link
                  href={`/events/${event.id}`}
                  className="mt-5 inline-flex text-sm font-medium text-brand hover:underline"
                >
                  View event details
                </Link>
              </Card>
            ))}
          </section>
        ) : (
          <Card className="mt-8 p-6">
            <h2 className="font-semibold text-slate-950">No upcoming events</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              There are no upcoming or ongoing volunteer opportunities visible to your account right now.
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
