import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminBadgesPage() {
  const { user } = await requireAdmin();
  const supabase = await createClient();
  const { data: badges } = await supabase.from("badges").select("id, code, name, description, is_active").order("name");
  return <AppShell userEmail={user.email} isAdmin><div className="grid gap-6"><div><p className="text-sm font-medium text-brand">Recognition</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Badges & achievements</h1><p className="mt-2 text-sm text-slate-600">Review the existing achievement catalog. Awards remain controlled by authorized server-side workflows.</p></div><Card className="p-5"><div className="grid gap-3">{badges?.length ? badges.map((badge) => <div key={badge.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-4"><div><p className="font-medium text-slate-950">{badge.name}</p><p className="text-sm text-slate-600">{badge.description || badge.code}</p></div><span className="text-xs text-brand">{badge.is_active ? "Active" : "Inactive"}</span></div>) : <p className="text-sm text-slate-600">No badges configured yet.</p>}</div></Card></div></AppShell>;
}
