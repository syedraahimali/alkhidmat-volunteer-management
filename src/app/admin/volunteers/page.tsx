import { Mail, MapPin, Phone, UsersRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminVolunteersPage() {
  const { user, roles } = await requireAdmin();
  const supabase = await createClient();
  const { data: volunteers } = await supabase
    .from("volunteers")
    .select("id, full_name, email, phone, city, skills, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AppShell userEmail={user.email} portal="admin" userRoles={roles}>
      <div className="grid gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-brand">
              <UsersRound className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-brand">Coordinator tools</p>
              <h1 className="text-3xl font-semibold text-slate-950">Volunteer management</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
            Browse volunteer profiles visible to your administrator role. Profile updates remain handled through existing secure workflows.
          </p>
        </section>

        <Card className="p-5">
          <div className="grid gap-3">
            {volunteers?.length ? (
              volunteers.map((volunteer) => (
                <article key={volunteer.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-slate-950">{volunteer.full_name || "Unnamed volunteer"}</h2>
                      <p className="mt-1 text-xs capitalize text-brand">{volunteer.status || "unknown"}</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {volunteer.created_at ? `Joined ${new Date(volunteer.created_at).toLocaleDateString()}` : "Join date unavailable"}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0 text-brand" />
                      {volunteer.email || "No email"}
                    </span>
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-brand" />
                      {volunteer.phone || "No phone"}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-brand" />
                      {volunteer.city || "No city"}
                    </span>
                  </div>
                  {volunteer.skills ? <p className="mt-3 text-sm leading-6 text-slate-600">{volunteer.skills}</p> : null}
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-600">No volunteers are visible to your account yet.</p>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
