import Link from "next/link";
import { CalendarDays, MapPin, Plus, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { formatEventDateTime } from "@/lib/events/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AdminEventsPageProps = {
  searchParams: Promise<{ created?: string }>;
};

export default async function AdminEventsPage({ searchParams }: AdminEventsPageProps) {
  const { user } = await requireAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("id, event_name, description, location, start_time, end_time, status, volunteer_slots, registration_closes_at")
    .order("start_time", { ascending: false })
    .limit(100);

  return (
    <AppShell userEmail={user.email} isAdmin>
      <div className="grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand">Coordinator tools</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Event management</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Review all events, open volunteer-facing details, and create new opportunities through the existing events table.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/events/new">
              <Plus className="h-4 w-4" />
              Create New Event
            </Link>
          </Button>
        </div>

        {params.created ? (
          <Alert className="border-teal-200 bg-teal-50 text-brand">Event created successfully and is now listed here.</Alert>
        ) : null}

        {error ? (
          <Alert className="border-red-200 bg-red-50 text-red-900">Events could not be loaded right now.</Alert>
        ) : events?.length ? (
          <section className="grid gap-4">
            {events.map((event) => (
              <Card key={event.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium uppercase text-brand">
                        {event.status}
                      </span>
                      <span className="text-xs text-slate-500">
                        {event.registration_closes_at
                          ? `Registration closes ${new Date(event.registration_closes_at).toLocaleString()}`
                          : "No registration deadline"}
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-slate-950">{event.event_name || "Untitled event"}</h2>
                    <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-600">
                      {event.description || "No description added yet."}
                    </p>
                    <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                      <span className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0 text-brand" />
                        {formatEventDateTime(event.start_time)}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-brand" />
                        {event.location || "Location pending"}
                      </span>
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4 shrink-0 text-brand" />
                        {event.volunteer_slots === null ? "Flexible capacity" : `${event.volunteer_slots} slots`}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/events/${event.id}`}>Volunteer view</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/attendance?event=${event.id}`}>Attendance</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>
        ) : (
          <Card className="p-6">
            <h2 className="font-semibold text-slate-950">No events yet</h2>
            <p className="mt-2 text-sm text-slate-600">Create the first event to start collecting volunteer registrations.</p>
            <Button asChild className="mt-5">
              <Link href="/admin/events/new">
                <Plus className="h-4 w-4" />
                Create New Event
              </Link>
            </Button>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
