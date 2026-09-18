import Link from "next/link";
import { Download } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const { user } = await requireAdmin();
  const supabase = await createClient();
  const [{ data: impact }, { data: events }] = await Promise.all([
    supabase.from("volunteer_impact_summary").select("volunteer_id, events_registered, events_attended, total_minutes, total_hours, certificates_earned, badges_earned").limit(1000),
    supabase.from("event_participation_summary").select("event_id, total_registrations, approved_registrations, waitlisted_registrations, attended_count, total_minutes, total_hours, available_slots").limit(1000),
  ]);
  const totalHours = (impact ?? []).reduce((sum, row) => sum + Number(row.total_hours ?? 0), 0);
  const totalAttended = (events ?? []).reduce((sum, row) => sum + Number(row.attended_count ?? 0), 0);
  return <AppShell userEmail={user.email} isAdmin><div className="grid gap-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-brand">Operations</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">NGO analytics</h1><p className="mt-2 text-sm text-slate-600">RLS-scoped participation and volunteer impact summaries.</p></div><Link href="/api/admin/analytics.csv" className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"><Download className="h-4 w-4" />Export CSV</Link></div><section className="grid gap-4 sm:grid-cols-3"><Card className="p-5"><p className="text-sm text-slate-500">Volunteers summarized</p><p className="mt-2 text-2xl font-semibold text-slate-950">{impact?.length ?? 0}</p></Card><Card className="p-5"><p className="text-sm text-slate-500">Total volunteer hours</p><p className="mt-2 text-2xl font-semibold text-slate-950">{totalHours.toFixed(2)}</p></Card><Card className="p-5"><p className="text-sm text-slate-500">Attendance records</p><p className="mt-2 text-2xl font-semibold text-slate-950">{totalAttended}</p></Card></section><Card className="p-5"><h2 className="text-lg font-semibold text-slate-950">Event participation</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">Event</th><th className="px-3 py-3">Registrations</th><th className="px-3 py-3">Approved</th><th className="px-3 py-3">Attended</th><th className="px-3 py-3">Hours</th></tr></thead><tbody>{events?.map((row) => <tr key={row.event_id} className="border-b border-slate-100"><td className="px-3 py-3">{row.event_id}</td><td className="px-3 py-3">{row.total_registrations}</td><td className="px-3 py-3">{row.approved_registrations}</td><td className="px-3 py-3">{row.attended_count}</td><td className="px-3 py-3">{row.total_hours}</td></tr>)}</tbody></table></div></Card></div></AppShell>;
}
