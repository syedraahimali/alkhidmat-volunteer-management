import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";
import type { AppRole } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequestBody = {
  messages?: ChatMessage[];
  portal?: "volunteer" | "admin";
};

type PortalContext = "volunteer" | "admin";

type EventSummary = {
  id: string;
  event_name: string | null;
  description?: string | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  volunteer_slots?: number | null;
  registration_closes_at?: string | null;
};

const fallbackReply =
  "I can help you with events, registration, attendance, certificates, badges, notifications, and portal navigation.";

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    candidate.content.trim().length > 0
  );
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function includesAny(question: string, terms: string[]) {
  return terms.some((term) => question.includes(term));
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "Date/time not set";
}

function formatEventDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Date not set";
}

function formatEventTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "Time not set";
}

function formatEventDetails(event: EventSummary, registrationStatus?: string | null) {
  const lines = [
    event.event_name || "Untitled event",
    `Status: ${event.status || "Not set"}`,
    `Start: ${formatDate(event.start_time)}`,
    `End: ${formatDate(event.end_time)}`,
    `Location: ${event.location || "Location not set"}`,
  ];

  if (registrationStatus) {
    lines.push(`Registration status: ${registrationStatus}`);
  }
  if (event.volunteer_slots !== undefined) {
    lines.push(`Capacity: ${event.volunteer_slots === null ? "Flexible capacity" : `${event.volunteer_slots} slots`}`);
  }
  if (event.registration_closes_at !== undefined) {
    lines.push(
      `Registration closes: ${
        event.registration_closes_at ? new Date(event.registration_closes_at).toLocaleString() : "No deadline set"
      }`,
    );
  }
  if (event.description) {
    lines.push(`Description: ${event.description}`);
  }

  return lines.join("\n");
}

function formatVolunteerUpcomingEvent(event: EventSummary, registrationStatus?: string | null) {
  const lines = [
    event.event_name || "Untitled event",
    formatEventDate(event.start_time),
    `${formatEventTime(event.start_time)} - ${formatEventTime(event.end_time)}`,
    `Location: ${event.location || "Location not set"}`,
  ];

  if (registrationStatus) {
    lines.push(`Registration status: ${registrationStatus}`);
  }

  return lines.join("\n");
}

function findEventByQuestion(events: EventSummary[], question: string) {
  const normalizedQuestion = normalize(question);
  return events.find((event) => {
    const name = normalize(event.event_name || "");
    return name.length > 2 && normalizedQuestion.includes(name);
  });
}

async function getVolunteerProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from("volunteers")
    .select("id, full_name")
    .eq("auth_user_id", userId)
    .maybeSingle();

  return profile;
}

async function getVolunteerRegistrations(supabase: Awaited<ReturnType<typeof createClient>>, volunteerId: string) {
  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("id, status, registered_at, event_id")
    .eq("volunteer_id", volunteerId)
    .order("registered_at", { ascending: false })
    .limit(100);
  const eventIds = [...new Set((registrations ?? []).map((registration) => registration.event_id))];
  const { data: events } = eventIds.length
    ? await supabase
        .from("events")
        .select("id, event_name, description, location, start_time, end_time, status, volunteer_slots, registration_closes_at")
        .in("id", eventIds)
    : { data: [] };

  return {
    registrations: registrations ?? [],
    events: (events ?? []) as EventSummary[],
  };
}

async function getVolunteerUpcomingRegisteredEvents(
  supabase: Awaited<ReturnType<typeof createClient>>,
  volunteerId: string,
) {
  const { registrations, events } = await getVolunteerRegistrations(supabase, volunteerId);
  const registrationMap = new Map(registrations.map((registration) => [registration.event_id, registration.status]));
  const upcomingEvents = events
    .filter((event) => event.status === "upcoming" || event.status === "ongoing")
    .sort((a, b) => {
      if (!a.start_time && !b.start_time) {
        return 0;
      }
      if (!a.start_time) {
        return 1;
      }
      if (!b.start_time) {
        return -1;
      }
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });

  return { upcomingEvents, registrationMap };
}

async function answerVolunteerUpcomingEvents(
  supabase: Awaited<ReturnType<typeof createClient>>,
  volunteerId: string,
) {
  const { upcomingEvents, registrationMap } = await getVolunteerUpcomingRegisteredEvents(supabase, volunteerId);

  if (!upcomingEvents.length) {
    return "You don't have any upcoming registered events.";
  }

  if (upcomingEvents.length === 1) {
    const event = upcomingEvents[0];
    return `Your upcoming event is:\n${formatVolunteerUpcomingEvent(event, registrationMap.get(event.id))}`;
  }

  return `Your upcoming registered events are:\n\n${upcomingEvents
    .map((event, index) => `${index + 1}. ${formatVolunteerUpcomingEvent(event, registrationMap.get(event.id))}`)
    .join("\n\n")}`;
}

async function answerVolunteerQuestion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  question: string,
) {
  const normalizedQuestion = normalize(question);
  const profile = await getVolunteerProfile(supabase, userId);

  if (!profile) {
    if (includesAny(normalizedQuestion, ["profile", "qr", "attendance", "events", "certificates", "badges"])) {
      return "Complete your volunteer profile first from Profile so I can find your events, attendance, certificates, and badges.";
    }
    return fallbackReply;
  }

  if (includesAny(normalizedQuestion, ["how do i register", "register for an event", "registration"])) {
    return "Open Events from the Volunteer Portal, choose an upcoming or ongoing event, review the requirements, then use the registration panel on the event page.";
  }

  if (includesAny(normalizedQuestion, ["qr", "check in", "check-in", "attendance work"])) {
    return "QR attendance is recorded when a coordinator scans your volunteer QR for an eligible event. You can open your QR from Profile, then Volunteer QR.";
  }

  if (includesAny(normalizedQuestion, ["access my profile", "my profile", "profile"])) {
    return "Open Profile from the Volunteer Portal navigation to update your contact details, interests, and volunteer QR.";
  }

  if (includesAny(normalizedQuestion, ["notification", "notifications"])) {
    const { data: notifications } = await supabase
      .from("notifications")
      .select("title, body, read_at, created_at")
      .or(`user_id.eq.${userId},volunteer_id.eq.${profile.id}`)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!notifications?.length) {
      return "You do not have any notifications right now.";
    }

    return notifications
      .map((notification) => {
        const status = notification.read_at ? "read" : "unread";
        return `${notification.title} (${status})\n${notification.body}`;
      })
      .join("\n\n");
  }

  if (includesAny(normalizedQuestion, ["certificate", "certificates"])) {
    const { data: certificates } = await supabase
      .from("certificates")
      .select("certificate_id, title, event_name, issued_at")
      .eq("volunteer_id", profile.id)
      .is("revoked_at", null)
      .order("issued_at", { ascending: false })
      .limit(10);

    if (!certificates?.length) {
      return "You do not have any certificates yet.";
    }

    return `You have ${certificates.length} certificate${certificates.length === 1 ? "" : "s"}:\n${certificates
      .map((certificate) => `${certificate.title} - ${certificate.event_name} (${certificate.certificate_id})`)
      .join("\n")}`;
  }

  if (includesAny(normalizedQuestion, ["badge", "badges"])) {
    const { data: badges } = await supabase
      .from("volunteer_badges")
      .select("id, earned_at, badge_id")
      .eq("volunteer_id", profile.id)
      .order("earned_at", { ascending: false })
      .limit(10);
    const badgeIds = [...new Set((badges ?? []).map((badge) => badge.badge_id))];
    const { data: badgeDefinitions } = badgeIds.length
      ? await supabase.from("badges").select("id, name, description").in("id", badgeIds)
      : { data: [] };
    const badgeMap = new Map((badgeDefinitions ?? []).map((badge) => [badge.id, badge]));

    if (!badges?.length) {
      return "You do not have any badges yet.";
    }

    return `You have ${badges.length} badge${badges.length === 1 ? "" : "s"}:\n${badges
      .map((badge) => {
        const definition = badgeMap.get(badge.badge_id);
        return `${definition?.name || "Badge"}${definition?.description ? ` - ${definition.description}` : ""}`;
      })
      .join("\n")}`;
  }

  if (includesAny(normalizedQuestion, ["attendance", "attended", "participated"])) {
    const { data: summary } = await supabase
      .from("volunteer_impact_summary")
      .select("events_registered, events_attended")
      .eq("volunteer_id", profile.id)
      .maybeSingle();

    return `Events Registered: ${summary?.events_registered ?? 0}\nEvents Attended: ${summary?.events_attended ?? 0}\nEvents Participated: ${summary?.events_attended ?? 0}`;
  }

  if (
    includesAny(normalizedQuestion, [
      "upcoming event",
      "upcoming events",
      "coming event",
      "events coming",
      "events are coming",
      "next event",
      "my next event",
      "when is my next event",
      "where is my next event",
      "where is my event",
      "what event am i attending",
      "my events",
      "my registered events",
      "registered events",
      "what are my events",
      "events am i registered",
    ])
  ) {
    return answerVolunteerUpcomingEvents(supabase, profile.id);
  }

  if (includesAny(normalizedQuestion, ["event details", "where is", "location"])) {
    const { registrations, events } = await getVolunteerRegistrations(supabase, profile.id);
    const event = findEventByQuestion(events, question);
    const registrationMap = new Map(registrations.map((registration) => [registration.event_id, registration.status]));

    if (event) {
      return formatEventDetails(event, registrationMap.get(event.id));
    }
  }

  return fallbackReply;
}

async function findAdminEvent(supabase: Awaited<ReturnType<typeof createClient>>, question: string) {
  const { data: events } = await supabase
    .from("events")
    .select("id, event_name, description, location, start_time, end_time, status, volunteer_slots, registration_closes_at")
    .order("start_time", { ascending: false })
    .limit(100);

  return {
    events: (events ?? []) as EventSummary[],
    event: findEventByQuestion((events ?? []) as EventSummary[], question),
  };
}

async function answerAdminQuestion(supabase: Awaited<ReturnType<typeof createClient>>, question: string) {
  const normalizedQuestion = normalize(question);

  if (includesAny(normalizedQuestion, ["create event", "new event", "add event"])) {
    return "Use Admin Portal > Create New Event, or open /admin/events/new.";
  }

  if (includesAny(normalizedQuestion, ["manage attendance", "attendance page", "qr attendance"])) {
    return "Use Admin Portal > Attendance, or open /admin/attendance to scan volunteer check-ins and review event attendance.";
  }

  if (includesAny(normalizedQuestion, ["where are certificates", "certificates"])) {
    return "Certificates are in Admin Portal > Certificates, or /admin/certificates.";
  }

  if (includesAny(normalizedQuestion, ["announcement", "announcements", "communications"])) {
    return "Announcements and communications are in Admin Portal > Communications, or /admin/communications.";
  }

  if (includesAny(normalizedQuestion, ["analytics", "reports"])) {
    return "Analytics are in Admin Portal > Analytics, or /admin/analytics.";
  }

  if (includesAny(normalizedQuestion, ["volunteers registered for", "registered for this event", "registrations for"])) {
    const { event } = await findAdminEvent(supabase, question);
    if (!event) {
      return "Tell me the event name and I can count registrations for it.";
    }

    const { count } = await supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id);
    return `${event.event_name || "This event"} has ${count ?? 0} registration${count === 1 ? "" : "s"}.`;
  }

  if (includesAny(normalizedQuestion, ["attended this event", "attendance for", "people attended"])) {
    const { event } = await findAdminEvent(supabase, question);
    if (!event) {
      return "Tell me the event name and I can count attendance for it.";
    }

    const { count } = await supabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .in("status", ["present", "late"]);
    return `${event.event_name || "This event"} has ${count ?? 0} attended volunteer${count === 1 ? "" : "s"}.`;
  }

  if (includesAny(normalizedQuestion, ["how many volunteers", "volunteers", "registered volunteers"])) {
    const { count } = await supabase.from("volunteers").select("id", { count: "exact", head: true });
    return `There are ${count ?? 0} volunteer${count === 1 ? "" : "s"} registered in the system.`;
  }

  if (includesAny(normalizedQuestion, ["upcoming events", "events upcoming", "what are the upcoming events"])) {
    const { data: events } = await supabase
      .from("events")
      .select("id, event_name, location, start_time, end_time, status, volunteer_slots, registration_closes_at")
      .eq("status", "upcoming")
      .order("start_time", { ascending: true })
      .limit(8);

    if (!events?.length) {
      return "There are no upcoming events right now.";
    }

    return events
      .map((event) => `${event.event_name || "Untitled event"}\nStart: ${formatDate(event.start_time)}\nLocation: ${event.location || "Location not set"}\nStatus: ${event.status || "Not set"}`)
      .join("\n\n");
  }

  if (includesAny(normalizedQuestion, ["event details", "show event details", "details for"])) {
    const { event } = await findAdminEvent(supabase, question);
    if (!event) {
      return "Tell me the event name and I can show its details.";
    }

    return formatEventDetails(event);
  }

  if (includesAny(normalizedQuestion, ["attendance"])) {
    const { count } = await supabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .in("status", ["present", "late"]);
    return `Total attended attendance records: ${count ?? 0}. For event scanning and review, open /admin/attendance.`;
  }

  return fallbackReply;
}

export async function POST(request: Request) {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid portal assistant request." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages.filter(isChatMessage).slice(-10) : [];
  const latestMessage = messages.at(-1);
  const portal: PortalContext = body.portal === "admin" ? "admin" : "volunteer";

  if (!latestMessage || latestMessage.role !== "user") {
    return NextResponse.json({ error: "Send a portal question to start chatting." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured, so portal data cannot be loaded." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to use the Portal Assistant." }, { status: 401 });
  }

  const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const roles = (roleRows ?? []).map((row) => row.role as AppRole);

  if (portal === "admin" && !isAdminRole(roles)) {
    return NextResponse.json(
      { error: "This assistant context is for administrators and coordinators only." },
      { status: 403 },
    );
  }

  const reply =
    portal === "admin"
      ? await answerAdminQuestion(supabase, latestMessage.content)
      : await answerVolunteerQuestion(supabase, user.id, latestMessage.content);

  return NextResponse.json({ reply });
}
