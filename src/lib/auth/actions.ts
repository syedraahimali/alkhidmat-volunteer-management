"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { APP_URL, isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validation/auth";
import { profileSchema } from "@/lib/validation/profile";

export type AuthActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function safeNextPath(next?: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

export async function loginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { message: "Supabase environment variables are not configured yet." };
  }

  const parsed = loginSchema.safeParse({
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
    next: formValue(formData, "next"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/", "layout");
  redirect(safeNextPath(parsed.data.next));
}

export async function signupAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { message: "Supabase environment variables are not configured yet." };
  }

  const parsed = signupSchema.safeParse({
    fullName: formValue(formData, "fullName"),
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
    phone: formValue(formData, "phone"),
    city: formValue(formData, "city"),
    skills: formValue(formData, "skills"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${APP_URL}/auth/callback?next=/dashboard`,
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
        city: parsed.data.city,
        skills: parsed.data.skills,
      },
    },
  });

  if (error) {
    return { message: error.message };
  }

  if (data.user) {
    const profile = {
      auth_user_id: data.user.id,
      email: parsed.data.email,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      city: parsed.data.city,
      skills: parsed.data.skills,
      status: "active",
    };

    const admin = createAdminClient();
    if (admin) {
      const { data: existingProfile, error: profileLookupError } = await admin
        .from("volunteers")
        .select("id")
        .eq("auth_user_id", data.user.id)
        .maybeSingle();
      const profileResult = profileLookupError
        ? { error: profileLookupError }
        : existingProfile
          ? await admin.from("volunteers").update(profile).eq("id", existingProfile.id)
          : await admin.from("volunteers").insert(profile);
      const { error: roleError } = await admin.from("user_roles").upsert(
        { user_id: data.user.id, role: "volunteer" },
        { onConflict: "user_id,role" },
      );
      if (profileResult.error || roleError) {
        return { message: "Your account was created, but we could not finish linking your volunteer profile. Please contact support." };
      }
    } else if (data.session) {
      const { data: existingProfile, error: profileLookupError } = await supabase
        .from("volunteers")
        .select("id")
        .eq("auth_user_id", data.user.id)
        .maybeSingle();
      const profileResult = profileLookupError
        ? { error: profileLookupError }
        : existingProfile
          ? await supabase.from("volunteers").update(profile).eq("id", existingProfile.id)
          : await supabase.from("volunteers").insert(profile);
      if (profileResult.error) {
        return { message: "Your account was created, but we could not finish linking your volunteer profile. Please try again." };
      }
    }
  }

  revalidatePath("/", "layout");

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    ok: true,
    message: "Signup started. Check your email if confirmation is enabled for this Supabase project.",
  };
}

export async function forgotPasswordAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { message: "Supabase environment variables are not configured yet." };
  }

  const parsed = forgotPasswordSchema.safeParse({
    email: formValue(formData, "email"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${APP_URL}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    return { message: error.message };
  }

  return { ok: true, message: "Password reset instructions have been sent if the email exists." };
}

export async function resetPasswordAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { message: "Supabase environment variables are not configured yet." };
  }

  const parsed = resetPasswordSchema.safeParse({
    password: formValue(formData, "password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { message: error.message };
  }

  return { ok: true, message: "Your password has been updated. You can continue to your dashboard." };
}

export async function updateProfileAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { message: "Supabase environment variables are not configured yet." };
  }

  const parsed = profileSchema.safeParse({
    fullName: formValue(formData, "fullName"),
    phone: formValue(formData, "phone"),
    city: formValue(formData, "city"),
    skills: formValue(formData, "skills"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "Your session has expired. Please log in again." };
  }

  const profile = {
    email: user.email ?? null,
    full_name: parsed.data.fullName,
    phone: parsed.data.phone,
    city: parsed.data.city,
    skills: parsed.data.skills,
    status: "active" as const,
  };

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("volunteers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const profileResult = profileLookupError
    ? { error: profileLookupError }
    : existingProfile
      ? await supabase.from("volunteers").update(profile).eq("id", existingProfile.id)
      : await supabase.from("volunteers").insert({ ...profile, auth_user_id: user.id });

  if (profileResult.error) {
    return { message: "We could not save your profile. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { ok: true, message: "Your volunteer profile has been saved." };
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/");
}
