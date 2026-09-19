"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser, getUserRoles, isAdminRole } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createEventSchema } from "@/lib/validation/events";

export type RegistrationActionState = {
  ok?: boolean;
  message?: string;
};

export type CreateEventActionState = {
  ok?: boolean;
  message?: string;
  eventId?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const eventIdSchema = z.uuid();

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function toIsoDateTime(value: string | null) {
  return value ? new Date(value).toISOString() : null;
}

function splitSkills(value: string | null) {
  if (!value) {
    return null;
  }

  const skills = value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  return skills.length ? skills : null;
}

export async function createEventAction(
  _state: CreateEventActionState,
  formData: FormData,
): Promise<CreateEventActionState> {
  if (!isSupabaseConfigured()) {
    return { message: "Supabase environment variables are not configured yet." };
  }

  const parsed = createEventSchema.safeParse({
    eventName: formValue(formData, "eventName"),
    description: formValue(formData, "description"),
    location: formValue(formData, "location"),
    startTime: formValue(formData, "startTime"),
    endTime: formValue(formData, "endTime"),
    status: formValue(formData, "status"),
    volunteerSlots: formValue(formData, "volunteerSlots"),
    registrationOpensAt: formValue(formData, "registrationOpensAt"),
    registrationClosesAt: formValue(formData, "registrationClosesAt"),
    taskRequirements: formValue(formData, "taskRequirements"),
    skillsRequired: formValue(formData, "skillsRequired"),
    coordinatorName: formValue(formData, "coordinatorName"),
    coordinatorContact: formValue(formData, "coordinatorContact"),
    instructions: formValue(formData, "instructions"),
    certificateTitle: formValue(formData, "certificateTitle"),
    certificateThresholdMinutes: formValue(formData, "certificateThresholdMinutes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { message: "Your session has expired. Please log in again." };
  }

  const roles = await getUserRoles(user.id);
  if (!isAdminRole(roles)) {
    return { message: "Only administrators and coordinators can create events." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      event_name: parsed.data.eventName,
      description: parsed.data.description,
      location: parsed.data.location,
      start_time: toIsoDateTime(parsed.data.startTime),
      end_time: toIsoDateTime(parsed.data.endTime),
      status: parsed.data.status,
      volunteer_slots: parsed.data.volunteerSlots,
      registration_opens_at: toIsoDateTime(parsed.data.registrationOpensAt),
      registration_closes_at: toIsoDateTime(parsed.data.registrationClosesAt),
      task_requirements: parsed.data.taskRequirements,
      skills_required: splitSkills(parsed.data.skillsRequired),
      coordinator_name: parsed.data.coordinatorName,
      coordinator_contact: parsed.data.coordinatorContact,
      instructions: parsed.data.instructions,
      certificate_title: parsed.data.certificateTitle,
      certificate_threshold_minutes: parsed.data.certificateThresholdMinutes ?? 0,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { message: error?.message ?? "We could not create the event. Please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath("/events");

  return { ok: true, message: "Event created successfully.", eventId: data.id };
}

export async function registerForEventAction(
  _state: RegistrationActionState,
  formData: FormData,
): Promise<RegistrationActionState> {
  if (!isSupabaseConfigured()) {
    return { message: "Supabase environment variables are not configured yet." };
  }

  const eventIdResult = eventIdSchema.safeParse(formData.get("eventId"));
  if (!eventIdResult.success) {
    return { message: "This event link is invalid." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { message: "Your session has expired. Please log in again." };
  }

  const supabase = await createClient();
  const { data: volunteer, error: volunteerError } = await supabase
    .from("volunteers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (volunteerError || !volunteer) {
    return { message: "Complete your volunteer profile before registering for an event." };
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, status, registration_opens_at, registration_closes_at")
    .eq("id", eventIdResult.data)
    .maybeSingle();

  if (eventError || !event) {
    return { message: "This event is no longer available." };
  }

  const now = Date.now();
  const opensAt = event.registration_opens_at ? Date.parse(event.registration_opens_at) : null;
  const closesAt = event.registration_closes_at ? Date.parse(event.registration_closes_at) : null;
  if (event.status !== "upcoming" && event.status !== "ongoing") {
    return { message: "Registration is not available for this event." };
  }
  if ((opensAt !== null && now < opensAt) || (closesAt !== null && now > closesAt)) {
    return { message: "Registration is currently closed for this event." };
  }

  const { error } = await supabase.from("event_registrations").insert({
    event_id: event.id,
    volunteer_id: volunteer.id,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return { message: "You are already registered for this event." };
    }
    return { message: "We could not submit your registration. Please try again." };
  }

  revalidatePath("/events");
  revalidatePath(`/events/${event.id}`);
  revalidatePath("/dashboard");

  return { ok: true, message: "Registration submitted for coordinator review." };
}

export async function cancelEventRegistrationAction(
  _state: RegistrationActionState,
  formData: FormData,
): Promise<RegistrationActionState> {
  const eventIdResult = eventIdSchema.safeParse(formData.get("eventId"));
  if (!eventIdResult.success) {
    return { message: "This event link is invalid." };
  }

  return {
    message: "Registration cancellation is currently managed by the coordinator. Contact the event coordinator to request a cancellation.",
  };
}
