"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type RegistrationActionState = {
  ok?: boolean;
  message?: string;
};

const eventIdSchema = z.uuid();

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
