"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser, requireAdmin } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type QrActionState = {
  ok?: boolean;
  message?: string;
  token?: string;
};

const eventIdSchema = z.uuid();
const tokenSchema = z.string().trim().min(32, "The QR value is incomplete.");

function hashQrToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function generateVolunteerQrAction(
  _state: QrActionState,
  _formData: FormData,
): Promise<QrActionState> {
  void _state;
  void _formData;
  if (!isSupabaseConfigured()) {
    return { message: "Supabase environment variables are not configured yet." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { message: "Your session has expired. Please log in again." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { message: "QR identity provisioning is not available on this server." };
  }

  const supabase = await createClient();
  const { data: volunteer, error: volunteerError } = await supabase
    .from("volunteers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (volunteerError || !volunteer) {
    return { message: "Complete your volunteer profile before generating a QR identity." };
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashQrToken(token);
  const now = new Date().toISOString();

  const { error: revokeError } = await admin
    .from("volunteer_qr_tokens")
    .update({ revoked_at: now })
    .eq("volunteer_id", volunteer.id)
    .is("revoked_at", null);

  if (revokeError) {
    return { message: "We could not rotate your QR identity. Please try again." };
  }

  const { error: insertError } = await admin.from("volunteer_qr_tokens").insert({
    volunteer_id: volunteer.id,
    token_hash: tokenHash,
    label: "Volunteer identity",
  });

  if (insertError) {
    return { message: "We could not create your QR identity. Please try again." };
  }

  revalidatePath("/profile/qr");
  return { ok: true, token };
}

export async function recordAttendanceScanAction(input: {
  eventId: string;
  token: string;
  offlineSyncId?: string;
}): Promise<QrActionState> {
  if (!isSupabaseConfigured()) {
    return { message: "Supabase environment variables are not configured yet." };
  }

  const eventIdResult = eventIdSchema.safeParse(input.eventId);
  const tokenResult = tokenSchema.safeParse(input.token);
  if (!eventIdResult.success || !tokenResult.success) {
    return { message: "The event or QR value is invalid." };
  }

  const { user } = await requireAdmin();
  const admin = createAdminClient();
  if (!admin) {
    return { message: "Attendance scanning is not available on this server." };
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const tokenHash = hashQrToken(tokenResult.data);
  const { data: token, error: tokenError } = await admin
    .from("volunteer_qr_tokens")
    .select("id, volunteer_id, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (tokenError || !token) {
    return { message: "This volunteer QR is not valid." };
  }
  if (token.revoked_at || (token.expires_at && new Date(token.expires_at) <= now)) {
    return { message: "This volunteer QR has expired or been revoked." };
  }

  const { data: event, error: eventError } = await admin
    .from("events")
    .select("id, event_name, status")
    .eq("id", eventIdResult.data)
    .maybeSingle();

  if (eventError || !event || (event.status !== "upcoming" && event.status !== "ongoing")) {
    return { message: "Select an upcoming or ongoing event before scanning." };
  }

  const { data: volunteer } = await admin
    .from("volunteers")
    .select("id, full_name")
    .eq("id", token.volunteer_id)
    .maybeSingle();

  const { data: existingAttendance, error: attendanceLookupError } = await admin
    .from("attendance")
    .select("id, check_in")
    .eq("volunteer_id", token.volunteer_id)
    .eq("event_id", event.id)
    .maybeSingle();

  if (attendanceLookupError) {
    return { message: "We could not verify existing attendance. Please try again." };
  }

  if (existingAttendance) {
    await admin.from("attendance_scan_logs").insert({
      event_id: event.id,
      volunteer_id: token.volunteer_id,
      attendance_id: existingAttendance.id,
      action: "check_in",
      scan_source: "volunteer_qr",
      token_id: token.id,
      scanned_by: user.id,
      offline_sync_id: input.offlineSyncId ?? null,
      result: "duplicate",
      message: "Attendance already exists for this volunteer and event.",
    });

    return {
      message: `${volunteer?.full_name || "This volunteer"} is already checked in for this event.`,
    };
  }

  const { data: attendance, error: attendanceError } = await admin
    .from("attendance")
    .insert({
      volunteer_id: token.volunteer_id,
      event_id: event.id,
      status: "present",
      check_in: nowIso,
      check_in_method: "volunteer_qr",
      checked_in_by: user.id,
    })
    .select("id")
    .single();

  if (attendanceError || !attendance) {
    await admin.from("attendance_scan_logs").insert({
      event_id: event.id,
      volunteer_id: token.volunteer_id,
      action: "check_in",
      scan_source: "volunteer_qr",
      token_id: token.id,
      scanned_by: user.id,
      offline_sync_id: input.offlineSyncId ?? null,
      result: "error",
      message: attendanceError?.message ?? "Attendance insert failed.",
    });
    return { message: "The attendance check-in could not be recorded." };
  }

  await admin.from("attendance_scan_logs").insert({
    event_id: event.id,
    volunteer_id: token.volunteer_id,
    attendance_id: attendance.id,
    action: "check_in",
    scan_source: "volunteer_qr",
    token_id: token.id,
    scanned_by: user.id,
    offline_sync_id: input.offlineSyncId ?? null,
    result: "success",
    message: "Attendance checked in by volunteer QR.",
  });

  revalidatePath("/admin/attendance");
  revalidatePath(`/admin/attendance?event=${event.id}`);
  return { ok: true, message: `${volunteer?.full_name || "Volunteer"} checked in successfully.` };
}
