import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { RegistrationActions } from "@/components/community/registration-actions";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminRegistrationsPage() {
  const { user } = await requireAdmin();
  const supabase = await createClient();
  const { data: registrations } = await supabase.from("event_registrations").select("id, status, registered_at, event_id, volunteer_id").order("registered_at", { ascending: false }).limit(100);
  const eventIds = (registrations ?? []).map((item) => item.event_id); const volunteerIds = (registrations ?? []).map((item) => item.volunteer_id);
  const [{ data: events }, { data: volunteers }] = await Promise.all([supabase.from("events").select("id, event_name").in("id", eventIds), supabase.from("volunteers").select("id, full_name, email").in("id", volunteerIds)]);
  const eventMap = new Map((events ?? []).map((item) => [item.id, item.event_name])); const volunteerMap = new Map((volunteers ?? []).map((item) => [item.id, item]));
  return <AppShell userEmail={user.email} isAdmin><div className="grid gap-6"><div><p className="text-sm font-medium text-brand">Coordinator tools</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Registration approvals</h1><p className="mt-2 text-sm text-slate-600">Review volunteer registrations. Approval and capacity enforcement remain controlled by the existing RLS and database trigger.</p></div><Card className="p-5"><div className="grid gap-3">{registrations?.length ? registrations.map((registration) => <div key={registration.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-4"><div><p className="font-medium text-slate-950">{volunteerMap.get(registration.volunteer_id)?.full_name || "Volunteer"}</p><p className="text-sm text-slate-600">{eventMap.get(registration.event_id) || "Event"} · {volunteerMap.get(registration.volunteer_id)?.email || ""}</p></div><RegistrationActions registrationId={registration.id} status={registration.status} /></div>) : <p className="text-sm text-slate-600">No registrations yet.</p>}</div></Card></div></AppShell>;
}
