import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { VolunteerQrCard } from "@/components/qr/volunteer-qr-card";
import { AppShell } from "@/components/layout/app-shell";
import { getUserRoles, isAdminRole, requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function VolunteerQrPage() {
  const user = await requireUser();
  const roles = await getUserRoles(user.id);

  return (
    <AppShell userEmail={user.email} isAdmin={isAdminRole(roles)}>
      <div className="grid gap-6">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>
        <VolunteerQrCard />
      </div>
    </AppShell>
  );
}
