import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/database.types";

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);

  return (data ?? []).map((row) => row.role);
}

export function isAdminRole(roles: AppRole[]) {
  return roles.some((role) => ["admin", "coordinator", "ngo_admin"].includes(role));
}

export function hasVolunteerRole(roles: AppRole[]) {
  return roles.includes("volunteer");
}

export async function requireAdmin() {
  const user = await requireUser();
  const roles = await getUserRoles(user.id);

  if (!isAdminRole(roles)) {
    redirect("/unauthorized");
  }

  return { user, roles };
}
