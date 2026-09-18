import Link from "next/link";
import { CalendarCheck, CheckCircle2, Clock3 } from "lucide-react";
import { CoordinatorScanner } from "@/components/qr/coordinator-scanner";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type AttendancePageProps = {
  searchParams: Promise<{ event?: string }>;
};

export default async function AdminAttendancePage({ searchParams }: AttendancePageProps) {
  const { user } = await requireAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, event_name, status, start_time")
    .order("start_time", { ascending: false })
    .limit(50);

  const eventOptions = events ?? [];
  const selectedEventId = params.event && eventOptions.some((event) => event.id === params.event) ? params.event : eventOptions[0]?.id;
  const selectedEvent = eventOptions.find((event) => event.id === selectedEventId);
  const { data: attendance, error: attendanceError } = selectedEventId
    ? await supabase
        .from("attendance")
        .select("id, volunteer_id, check_in, check_out, status, check_in_method")
        .eq("event_id", selectedEventId)
        .order("check_in", { ascending: false })
    : { data: [], error: null };

  const volunteerIds = [...new Set((attendance ?? []).map((record) => record.volunteer_id).filter(Boolean))] as string[];
  const { data: volunteers } = volunteerIds.length
    ? await supabase.from("volunteers").select("id, full_name, email").in("id", volunteerIds)
    : { data: [] };
  const volunteerMap = new Map((volunteers ?? []).map((volunteer) => [volunteer.id, volunteer]));

  return (
    <AppShell userEmail={user.email} isAdmin>
      <div className="grid gap-6">
        <div>
          <p className="text-sm font-medium text-brand">Coordinator tools</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">QR attendance</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Scan volunteer identities into a selected event. Every successful check-in is recorded server-side with the QR method.
          </p>
        </div>

        {eventsError ? (
          <Alert className="border-red-200 bg-red-50 text-red-900">Events could not be loaded for attendance scanning.</Alert>
        ) : !eventOptions.length ? (
          <Card className="p-6">
            <h2 className="font-semibold text-slate-950">No events available</h2>
            <p className="mt-2 text-sm text-slate-600">Create or publish an event before opening attendance scanning.</p>
          </Card>
        ) : (
          <>
            <CoordinatorScanner events={eventOptions.map(({ id, event_name, status }) => ({ id, event_name, status }))} />
            <section className="grid gap-5 lg:grid-cols-[240px_1fr]">
              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <CalendarCheck className="h-4 w-4 text-brand" />
                  Events
                </div>
                <nav className="mt-4 grid gap-1">
                  {eventOptions.map((event) => (
                    <Link
                      key={event.id}
                      href={`/admin/attendance?event=${event.id}`}
                      className={`rounded-md px-3 py-2 text-sm ${event.id === selectedEventId ? "bg-teal-50 font-medium text-brand" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      {event.event_name || "Untitled event"}
                    </Link>
                  ))}
                </nav>
              </Card>
              <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Attendance view</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">{selectedEvent?.event_name || "Select an event"}</h2>
                  </div>
                  <span className="text-sm capitalize text-slate-500">{selectedEvent?.status}</span>
                </div>
                {attendanceError ? (
                  <Alert className="mt-5 border-red-200 bg-red-50 text-red-900">Attendance records could not be loaded.</Alert>
                ) : attendance?.length ? (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-3 font-medium">Volunteer</th>
                          <th className="px-3 py-3 font-medium">Check-in</th>
                          <th className="px-3 py-3 font-medium">Method</th>
                          <th className="px-3 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((record) => {
                          const volunteer = record.volunteer_id ? volunteerMap.get(record.volunteer_id) : null;
                          return (
                            <tr key={record.id} className="border-b border-slate-100 last:border-0">
                              <td className="px-3 py-3">
                                <p className="font-medium text-slate-950">{volunteer?.full_name || "Unknown volunteer"}</p>
                                <p className="text-xs text-slate-500">{volunteer?.email || ""}</p>
                              </td>
                              <td className="px-3 py-3 text-slate-600">
                                {record.check_in ? new Date(record.check_in).toLocaleString() : "Not checked in"}
                              </td>
                              <td className="px-3 py-3 capitalize text-slate-600">{record.check_in_method || "Manual"}</td>
                              <td className="px-3 py-3">
                                <span className="inline-flex items-center gap-1 text-brand">
                                  <CheckCircle2 className="h-4 w-4" />
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-5 rounded-md border border-dashed border-slate-300 p-8 text-center">
                    <Clock3 className="mx-auto h-6 w-6 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-600">No attendance records for this event yet.</p>
                  </div>
                )}
              </Card>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
