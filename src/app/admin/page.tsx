import { BarChart3, CalendarPlus, ClipboardCheck, Megaphone, Award, ShieldCheck, UsersRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user } = await requireAdmin();

  const cards = [
    { label: "Event management", phase: "View events", icon: CalendarPlus, href: "/admin/events" },
    { label: "Create New Event", phase: "Add a volunteer opportunity", icon: CalendarPlus, href: "/admin/events/new" },
    { label: "QR attendance", phase: "Scan volunteer check-ins", icon: CalendarPlus, href: "/admin/attendance" },
    { label: "Registration approvals", phase: "Review registrations", icon: ClipboardCheck, href: "/admin/registrations" },
    { label: "Communications", phase: "Announcements", icon: Megaphone, href: "/admin/communications" },
    { label: "Certificates", phase: "Generate certificates", icon: Award, href: "/admin/certificates" },
    { label: "Badges", phase: "Review achievements", icon: Award, href: "/admin/badges" },
    { label: "Volunteer roster", phase: "Browse volunteers", icon: UsersRound },
    { label: "Analytics and reports", phase: "Open analytics", icon: BarChart3, href: "/admin/analytics" },
  ];

  return (
    <AppShell userEmail={user.email} isAdmin>
      <div className="grid gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-brand">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-brand">Coordinator/Admin</p>
              <h1 className="text-3xl font-semibold text-slate-950">Admin dashboard foundation</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
            This route is protected by server-side role checks. Admin capabilities will be filled in across the event,
            attendance, certificate, communication, and reporting phases.
          </p>
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
