import { Award, BarChart3, CalendarPlus, CheckCircle2, ClipboardCheck, Megaphone, QrCode, ShieldCheck, UsersRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user, roles } = await requireAdmin();
  const supabase = await createClient();
  const [
    volunteersResult,
    upcomingEventsResult,
    completedEventsResult,
    attendanceResult,
    pendingRegistrationsResult,
    certificatesResult,
  ] = await Promise.all([
    supabase.from("volunteers").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "upcoming"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("attendance").select("id", { count: "exact", head: true }).in("status", ["present", "late"]),
    supabase.from("event_registrations").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("certificates").select("id", { count: "exact", head: true }).is("revoked_at", null),
  ]);

  const stats = [
    { label: "Total Volunteers", value: volunteersResult.count ?? 0, icon: UsersRound },
    { label: "Upcoming Events", value: upcomingEventsResult.count ?? 0, icon: CalendarPlus },
    { label: "Completed Events", value: completedEventsResult.count ?? 0, icon: CheckCircle2 },
    { label: "Total Attendance", value: attendanceResult.count ?? 0, icon: QrCode },
    { label: "Pending Registrations", value: pendingRegistrationsResult.count ?? 0, icon: ClipboardCheck },
    { label: "Certificates Issued", value: certificatesResult.count ?? 0, icon: Award },
  ];

  const cards = [
    { label: "Event management", phase: "View events", icon: CalendarPlus, href: "/admin/events" },
    { label: "Create New Event", phase: "Add a volunteer opportunity", icon: CalendarPlus, href: "/admin/events/new" },
    { label: "QR attendance", phase: "Scan volunteer check-ins", icon: CalendarPlus, href: "/admin/attendance" },
    { label: "Registration approvals", phase: "Review registrations", icon: ClipboardCheck, href: "/admin/registrations" },
    { label: "Communications", phase: "Announcements", icon: Megaphone, href: "/admin/communications" },
    { label: "Certificates", phase: "Generate certificates", icon: Award, href: "/admin/certificates" },
    { label: "Badges", phase: "Review achievements", icon: Award, href: "/admin/badges" },
    { label: "Volunteer management", phase: "Browse volunteers", icon: UsersRound, href: "/admin/volunteers" },
    { label: "Analytics and reports", phase: "Open analytics", icon: BarChart3, href: "/admin/analytics" },
  ];

  return (
    <AppShell userEmail={user.email} portal="admin" userRoles={roles}>
      <div className="grid gap-6">
        <section className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-brand">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-teal-100">Admin Portal</p>
              <h1 className="text-3xl font-semibold text-white">Volunteer Management Administration</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Coordinate events, volunteer registrations, QR attendance, certificates, communications, badges, and reporting.
          </p>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-slate-200 bg-white p-5">
                <Icon className="h-5 w-5 text-brand" />
                <p className="mt-4 text-sm text-slate-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{stat.value}</p>
              </Card>
            );
          })}
        </section>
        <section className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className="p-5">
                <Icon className="h-5 w-5 text-brand" />
                <h2 className="mt-4 font-semibold text-slate-950">{card.label}</h2>
                {"href" in card && card.href ? (
                  <Link href={card.href} className="mt-2 inline-flex text-sm font-medium text-brand hover:underline">
                    {card.phase}
                  </Link>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">{card.phase}</p>
                )}
              </Card>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
