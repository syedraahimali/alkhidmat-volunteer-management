import { UserRound } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";
import { getUserRoles, isAdminRole, requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const roles = await getUserRoles(user.id);
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("volunteers")
    .select("id, full_name, email, phone, city, skills, status, created_at, updated_at")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (
    <AppShell userEmail={user.email} isAdmin={isAdminRole(roles)}>
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-brand">
            <UserRound className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Volunteer profile</h1>
            <p className="text-sm text-slate-500">Keep your contact details and volunteer interests up to date.</p>
          </div>
        </div>
        {error ? (
          <Alert className="mt-6 border-red-200 bg-red-50 text-red-900">
            We could not load your volunteer profile. Please refresh and try again.
          </Alert>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_240px]">
            <ProfileForm profile={profile} />
            <aside className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Account status</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{profile?.status ?? "Needs profile"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {profile?.id ? `Volunteer ID: ${profile.id}` : "Complete this form to link your volunteer profile."}
              </p>
              {profile?.updated_at ? (
                <p className="mt-4 text-xs text-slate-500">
                  Updated {new Date(profile.updated_at).toLocaleDateString()}
                </p>
              ) : null}
              <Link href="/profile/qr" className="mt-5 inline-flex text-sm font-medium text-brand hover:underline">
                Open volunteer QR
              </Link>
            </aside>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
