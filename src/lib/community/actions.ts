"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser, requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CommunityActionState = { ok?: boolean; message?: string };

const messageSchema = z.object({ eventId: z.uuid(), body: z.string().trim().min(1).max(2000) });
const announcementSchema = z.object({ title: z.string().trim().min(2), body: z.string().trim().min(2), audience: z.enum(["public", "all_volunteers", "registered_volunteers", "approved_volunteers", "admins"]), eventId: z.string().optional() });
const registrationStatusSchema = z.object({ registrationId: z.uuid(), status: z.enum(["approved", "rejected", "waitlisted", "cancelled"]) });

export async function markNotificationReadAction(notificationId: string): Promise<CommunityActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Your session has expired." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_notification_read", { notification: notificationId });
  if (error) return { message: "Notification could not be updated." };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function sendMessageAction(_state: CommunityActionState, formData: FormData): Promise<CommunityActionState> {
  const parsed = messageSchema.safeParse({ eventId: formData.get("eventId"), body: formData.get("body") });
  if (!parsed.success) return { message: "Enter a message before sending." };
  const user = await getCurrentUser();
  if (!user) return { message: "Your session has expired." };
  const supabase = await createClient();
  const { data: profile } = await supabase.from("volunteers").select("id").eq("auth_user_id", user.id).maybeSingle();
  const { error } = await supabase.from("messages").insert({ event_id: parsed.data.eventId, sender_user_id: user.id, volunteer_id: profile?.id ?? null, body: parsed.data.body, visibility: "event" });
  if (error) return { message: "Message could not be sent. You may need to be registered for this event." };
  revalidatePath(`/events/${parsed.data.eventId}`);
  return { ok: true, message: "Message sent." };
}

export async function createAnnouncementAction(_state: CommunityActionState, formData: FormData): Promise<CommunityActionState> {
  const parsed = announcementSchema.safeParse({ title: formData.get("title"), body: formData.get("body"), audience: formData.get("audience"), eventId: formData.get("eventId") || undefined });
  if (!parsed.success) return { message: "Complete the announcement fields." };
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return { message: "Admin operations are unavailable on this server." };
  const { error } = await admin.from("announcements").insert({ title: parsed.data.title, body: parsed.data.body, audience: parsed.data.audience, event_id: parsed.data.eventId || null, published_at: new Date().toISOString(), created_by: user.id });
  if (error) return { message: "Announcement could not be published." };
  revalidatePath("/dashboard");
  revalidatePath("/admin/communications");
  return { ok: true, message: "Announcement published." };
}

export async function updateRegistrationStatusAction(_state: CommunityActionState, formData: FormData): Promise<CommunityActionState> {
  const parsed = registrationStatusSchema.safeParse({ registrationId: formData.get("registrationId"), status: formData.get("status") });
  if (!parsed.success) return { message: "Invalid registration update." };
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return { message: "Admin operations are unavailable on this server." };
  const { error } = await admin.from("event_registrations").update({ status: parsed.data.status, reviewed_at: new Date().toISOString() }).eq("id", parsed.data.registrationId);
  if (error) return { message: error.message.includes("capacity") ? "Event capacity has been reached." : "Registration could not be updated." };
  revalidatePath("/admin/registrations");
  revalidatePath("/dashboard");
  return { ok: true, message: `Registration ${parsed.data.status}.` };
}

export async function generateCertificateAction(_state: CommunityActionState, formData: FormData): Promise<CommunityActionState> {
  const attendanceId = z.uuid().safeParse(formData.get("attendanceId"));
  if (!attendanceId.success) return { message: "Select a valid attendance record." };
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return { message: "Admin operations are unavailable on this server." };
  const { data: attendance } = await admin.from("attendance").select("id, volunteer_id, event_id, check_in, check_out, status").eq("id", attendanceId.data).maybeSingle();
  if (!attendance?.volunteer_id || !attendance.event_id || attendance.status === "absent") return { message: "Attendance is not eligible for a certificate." };
  const [{ data: volunteer }, { data: event }] = await Promise.all([
    admin.from("volunteers").select("full_name").eq("id", attendance.volunteer_id).maybeSingle(),
    admin.from("events").select("event_name, start_time, certificate_title").eq("id", attendance.event_id).maybeSingle(),
  ]);
  if (!volunteer || !event) return { message: "Volunteer or event details are missing." };
  const { data: existing } = await admin.from("certificates").select("id").eq("event_id", attendance.event_id).eq("volunteer_id", attendance.volunteer_id).maybeSingle();
  if (existing) return { message: "A certificate already exists for this attendance." };
  const certificateId = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const verificationCode = crypto.randomUUID();
  const minutes = attendance.check_in && attendance.check_out ? Math.max(0, Math.floor((Date.parse(attendance.check_out) - Date.parse(attendance.check_in)) / 60000)) : 0;
  const { error } = await admin.from("certificates").insert({ certificate_id: certificateId, volunteer_id: attendance.volunteer_id, event_id: attendance.event_id, attendance_id: attendance.id, title: event.certificate_title || "Volunteer Service Certificate", organization_name: "Alkhidmat Karachi", volunteer_name: volunteer.full_name || "Volunteer", event_name: event.event_name || "Volunteer event", event_date: event.start_time ? event.start_time.slice(0, 10) : null, hours: Number((minutes / 60).toFixed(2)), issued_by: user.id, verification_code: verificationCode });
  if (error) return { message: "Certificate could not be generated." };
  revalidatePath("/dashboard");
  revalidatePath("/admin/certificates");
  return { ok: true, message: `Certificate ${certificateId} generated.` };
}
