import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, MapPin, MessageSquare, Users } from "lucide-react";
import { RegistrationPanel } from "@/components/events/registration-panel";
import { MessageForm } from "@/components/community/message-form";
import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { getUserRoles, requireUser } from "@/lib/auth/session";
import { formatEventDateTime, formatRegistrationWindow } from "@/lib/events/format";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EventDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const user = await requireUser();
  const roles = await getUserRoles(user.id);
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <AppShell userEmail={user.email} portal="volunteer" userRoles={roles}>
        <Alert>Supabase is not configured yet. Event details cannot be loaded.</Alert>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      "id, event_name, description, location, start_time, end_time, status, volunteer_slots, registration_opens_at, registration_closes_at, skills_required, task_requirements, instructions, coordinator_name, coordinator_contact",
    )
    .eq("id", id)
    .in("status", ["upcoming", "ongoing"])
    .maybeSingle();

  if (!event && !eventError) {
    notFound();
  }

  if (eventError || !event) {
    return (
      <AppShell userEmail={user.email} portal="volunteer" userRoles={roles}>
        <Alert className="border-red-200 bg-red-50 text-red-900">
          We could not load this event. Please refresh and try again.
        </Alert>
      </AppShell>
    );
  }

  const [{ data: profile }, { data: tasks, error: tasksError }, { data: messages }] = await Promise.all([
    supabase.from("volunteers").select("id").eq("auth_user_id", user.id).maybeSingle(),
    supabase
      .from("event_tasks")
      .select("id, title, description, skills_required, slots, starts_at, ends_at")
      .eq("event_id", event.id)
      .order("starts_at", { ascending: true }),
    supabase.from("messages").select("id, body, created_at, sender_user_id, volunteer_id").eq("event_id", event.id).eq("visibility", "event").is("deleted_at", null).order("created_at", { ascending: true }).limit(50),
  ]);

  const { data: registration } = profile
    ? await supabase
        .from("event_registrations")
        .select("id, status, registered_at")
        .eq("event_id", event.id)
        .eq("volunteer_id", profile.id)
        .maybeSingle()
    : { data: null };

  const registrationOpen = event.status === "upcoming" || event.status === "ongoing";

  return (
    <AppShell userEmail={user.email} portal="volunteer" userRoles={roles}>
      <div className="grid gap-6">
        <Link href="/events" className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-brand">{event.status}</span>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">{event.event_name || "Untitled event"}</h1>
            </div>
            <div className="flex items-center gap-2 rounded-md bg-teal-50 px-3 py-2 text-sm font-medium text-brand">
              <CheckCircle2 className="h-4 w-4" />
              Authenticated volunteer event
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700">
            {event.description || "The coordinator has not added a description yet."}
          </p>
          <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand" />
              {formatEventDateTime(event.start_time)}
            </span>
            <span className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-brand" />
              Ends {formatEventDateTime(event.end_time)}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand" />
              {event.location || "Location to be announced"}
            </span>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" />
              {event.volunteer_slots === null ? "Flexible capacity" : `${event.volunteer_slots} volunteer slots`}
            </span>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-950">Requirements</h2>
              <dl className="mt-5 grid gap-5">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Skills and interests</dt>
                  <dd className="mt-1 text-sm leading-6 text-slate-700">
                    {event.skills_required?.length ? event.skills_required.join(", ") : "No specific skills listed."}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Task requirements</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {event.task_requirements || "The coordinator has not added task requirements yet."}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Registration window</dt>
                  <dd className="mt-1 text-sm leading-6 text-slate-700">
                    {formatRegistrationWindow(event.registration_opens_at, event.registration_closes_at)}
                  </dd>
                </div>
              </dl>
            </Card>

            {tasksError ? (
              <Alert className="border-red-200 bg-red-50 text-red-900">
                Event tasks could not be loaded.
              </Alert>
            ) : tasks?.length ? (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-950">Available task assignments</h2>
                <div className="mt-5 grid gap-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="rounded-md border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-medium text-slate-950">{task.title}</h3>
                        {task.slots !== null ? <span className="text-xs text-slate-500">{task.slots} slots</span> : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {task.description || "No additional task details."}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {event.instructions ? (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-950">Instructions</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{event.instructions}</p>
              </Card>
            ) : null}
            <Card className="p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950"><MessageSquare className="h-5 w-5 text-brand" /> Event Q&A</h2>
              <div className="mt-4 grid gap-3">{messages?.length ? messages.map((message) => <div key={message.id} className="rounded-md border border-slate-200 p-3"><p className="text-sm leading-6 text-slate-700">{message.body}</p><p className="mt-1 text-xs text-slate-500">{new Date(message.created_at).toLocaleString()}</p></div>) : <p className="text-sm text-slate-600">No questions yet.</p>}</div>
              <div className="mt-5"><MessageForm eventId={event.id} /></div>
            </Card>
          </div>

          <div className="grid content-start gap-6">
            <RegistrationPanel
              eventId={event.id}
              registration={registration}
              registrationOpen={registrationOpen}
              profileLinked={Boolean(profile)}
            />
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Capacity</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {event.volunteer_slots === null ? "No fixed capacity" : `${event.volunteer_slots} volunteer slots`}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Final availability is enforced when coordinators approve registrations.
              </p>
            </Card>
            {event.coordinator_name || event.coordinator_contact ? (
              <Card className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Coordinator</p>
                <p className="mt-2 font-semibold text-slate-950">{event.coordinator_name || "Event coordinator"}</p>
                {event.coordinator_contact ? <p className="mt-1 text-sm text-slate-600">{event.coordinator_contact}</p> : null}
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
