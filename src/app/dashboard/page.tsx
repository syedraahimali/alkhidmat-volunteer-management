import Link from "next/link";
import { Award, Bell, CalendarCheck, Clock, Medal, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { getUserRoles, requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { markNotificationReadAction } from "@/lib/community/actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const roles = await getUserRoles(user.id);
  const supabase = await createClient();
  const { data: profile } = await supabase.from("volunteers").select("id, full_name, status").eq("auth_user_id", user.id).maybeSingle();
  const volunteerId = profile?.id;
  const [{ data: impact }, { data: registrations }, { data: certificates }, { data: badges }, { data: notifications }, { data: announcements }] = await Promise.all([
    volunteerId ? supabase.from("volunteer_impact_summary").select("events_registered, events_attended, total_minutes, total_hours, certificates_earned, badges_earned").eq("volunteer_id", volunteerId).maybeSingle() : Promise.resolve({ data: null }),
    volunteerId ? supabase.from("event_registrations").select("id, status, registered_at, event_id").eq("volunteer_id", volunteerId).order("registered_at", { ascending: false }).limit(8) : Promise.resolve({ data: [] }),
    volunteerId ? supabase.from("certificates").select("id, certificate_id, title, event_name, hours, issued_at, verification_code").eq("volunteer_id", volunteerId).order("issued_at", { ascending: false }).limit(8) : Promise.resolve({ data: [] }),
    volunteerId ? supabase.from("volunteer_badges").select("id, earned_at, badge_id").eq("volunteer_id", volunteerId).order("earned_at", { ascending: false }).limit(8) : Promise.resolve({ data: [] }),
    supabase.from("notifications").select("id, title, body, read_at, created_at").or(`user_id.eq.${user.id}${volunteerId ? `,volunteer_id.eq.${volunteerId}` : ""}`).order("created_at", { ascending: false }).limit(8),
    supabase.from("announcements").select("id, title, body, published_at, audience").in("audience", ["public", "all_volunteers"]).not("published_at", "is", null).order("published_at", { ascending: false }).limit(5),
  ]);
  const registrationEventIds = (registrations ?? []).map((item) => item.event_id);
  const badgeIds = (badges ?? []).map((item) => item.badge_id);
  const [{ data: registrationEvents }, { data: badgeDefinitions }] = await Promise.all([
    registrationEventIds.length ? supabase.from("events").select("id, event_name, start_time").in("id", registrationEventIds) : Promise.resolve({ data: [] }),
    badgeIds.length ? supabase.from("badges").select("id, name, description").in("id", badgeIds) : Promise.resolve({ data: [] }),
  ]);
  const eventMap = new Map((registrationEvents ?? []).map((item) => [item.id, item]));
  const badgeMap = new Map((badgeDefinitions ?? []).map((item) => [item.id, item]));
  const summary = impact ?? { events_registered: 0, events_attended: 0, total_minutes: 0, total_hours: 0, certificates_earned: 0, badges_earned: 0 };
  return <AppShell userEmail={user.email} portal="volunteer" userRoles={roles}><div className="grid gap-6">
    {!profile ? <Alert className="border-red-200 bg-red-50 text-red-900">Complete your volunteer profile to unlock personal impact tracking. <Link href="/profile" className="font-medium underline">Complete profile</Link></Alert> : null}
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-medium text-brand">Volunteer Portal</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}</h1><p className="mt-2 text-sm text-slate-600">Your events, participation, certificates, badges, and updates in one place.</p><p className="mt-3 text-sm font-medium text-slate-700">You have volunteered at {summary.events_attended ?? 0} events.</p></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[{ label: "Events Registered", value: summary.events_registered, Icon: CalendarCheck }, { label: "Events Attended", value: summary.events_attended, Icon: Clock }, { label: "Events Participated", value: summary.events_attended, Icon: CalendarCheck }, { label: "Certificates", value: summary.certificates_earned, Icon: Award }, { label: "Badges", value: summary.badges_earned, Icon: Medal }, { label: "Profile", value: profile?.status ?? "Needs setup", Icon: UserRound }].map(({ label, value, Icon }) => <Card key={label} className="p-5"><Icon className="h-5 w-5 text-brand" /><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold text-slate-950">{String(value)}</p>{label === "Events Participated" ? <p className="mt-2 text-xs text-slate-500">Your participation in volunteer events.</p> : null}</Card>)}</section>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-950">Registered events</h2><Link href="/events" className="text-sm font-medium text-brand hover:underline">Browse events</Link></div>{registrations?.length ? <div className="mt-4 grid gap-3">{registrations.map((registration) => <div key={registration.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3"><div><p className="font-medium text-slate-950">{eventMap.get(registration.event_id)?.event_name || "Event"}</p><p className="text-xs text-slate-500">{eventMap.get(registration.event_id)?.start_time ? new Date(eventMap.get(registration.event_id)!.start_time!).toLocaleString() : "Date pending"}</p></div><span className="text-xs capitalize text-brand">{registration.status}</span></div>)}</div> : <p className="mt-4 text-sm text-slate-600">No registrations yet.</p>}</Card>
      <Card className="p-5"><div className="flex items-center gap-2"><Bell className="h-5 w-5 text-brand" /><h2 className="text-lg font-semibold text-slate-950">Notifications</h2></div>{notifications?.length ? <div className="mt-4 grid gap-3">{notifications.map((notification) => <div key={notification.id} className={`rounded-md border p-3 ${notification.read_at ? "border-slate-200" : "border-teal-200 bg-teal-50/40"}`}><div className="flex justify-between gap-3"><p className="font-medium text-slate-950">{notification.title}</p>{!notification.read_at ? <form action={async () => { "use server"; await markNotificationReadAction(notification.id); }}><button className="text-xs text-brand hover:underline">Mark read</button></form> : null}</div><p className="mt-1 text-sm text-slate-600">{notification.body}</p></div>)}</div> : <p className="mt-4 text-sm text-slate-600">No notifications yet.</p>}</Card>
      <Card id="certificates" className="p-5"><h2 className="text-lg font-semibold text-slate-950">Certificates</h2>{certificates?.length ? <div className="mt-4 grid gap-3">{certificates.map((certificate) => <div key={certificate.id} className="rounded-md border border-slate-200 p-3"><p className="font-medium text-slate-950">{certificate.title}</p><p className="text-sm text-slate-600">{certificate.event_name} · {certificate.hours} hours</p><p className="mt-1 text-xs text-slate-500">{certificate.certificate_id}</p></div>)}</div> : <p className="mt-4 text-sm text-slate-600">Certificates appear after eligible attendance is verified.</p>}</Card>
      <Card id="badges" className="p-5"><h2 className="text-lg font-semibold text-slate-950">Badges & achievements</h2>{badges?.length ? <div className="mt-4 grid gap-3">{badges.map((badge) => <div key={badge.id} className="rounded-md border border-slate-200 p-3"><p className="font-medium text-slate-950">{badgeMap.get(badge.badge_id)?.name || "Achievement"}</p><p className="text-sm text-slate-600">{badgeMap.get(badge.badge_id)?.description}</p></div>)}</div> : <p className="mt-4 text-sm text-slate-600">Keep participating to earn achievements.</p>}</Card>
    </div>
    <Card id="announcements" className="p-5"><h2 className="text-lg font-semibold text-slate-950">Announcements</h2>{announcements?.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{announcements.map((announcement) => <article key={announcement.id} className="rounded-md border border-slate-200 p-4"><p className="font-medium text-slate-950">{announcement.title}</p><p className="mt-2 text-sm leading-6 text-slate-600">{announcement.body}</p></article>)}</div> : <p className="mt-4 text-sm text-slate-600">No announcements yet.</p>}</Card>
  </div></AppShell>;
}
