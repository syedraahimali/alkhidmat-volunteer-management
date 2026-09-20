import { AnnouncementForm } from "@/components/community/announcement-form";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CommunicationsPage() {
  const { user, roles } = await requireAdmin();
  const supabase = await createClient();
  const { data: announcements } = await supabase.from("announcements").select("id, title, body, audience, published_at").order("published_at", { ascending: false }).limit(20);
  return <AppShell userEmail={user.email} portal="admin" userRoles={roles}><div className="grid gap-6"><div><p className="text-sm font-medium text-brand">Coordinator tools</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Announcements</h1></div><AnnouncementForm /><Card className="p-5"><h2 className="text-lg font-semibold text-slate-950">Published announcements</h2><div className="mt-4 grid gap-3">{announcements?.length ? announcements.map((item) => <article key={item.id} className="rounded-md border border-slate-200 p-4"><div className="flex justify-between gap-3"><h3 className="font-medium text-slate-950">{item.title}</h3><span className="text-xs capitalize text-brand">{item.audience.replaceAll("_", " ")}</span></div><p className="mt-2 text-sm text-slate-600">{item.body}</p></article>) : <p className="text-sm text-slate-600">No announcements yet.</p>}</div></Card></div></AppShell>;
}
