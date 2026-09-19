import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequestBody = {
  messages?: ChatMessage[];
};

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

function getOutputText(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as { output_text?: unknown; output?: unknown };
  if (typeof candidate.output_text === "string" && candidate.output_text.trim()) {
    return candidate.output_text.trim();
  }

  if (!Array.isArray(candidate.output)) {
    return null;
  }

  const parts: string[] = [];
  for (const item of candidate.output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) {
      continue;
    }

    for (const block of content) {
      if (block && typeof block === "object") {
        const text = (block as { text?: unknown }).text;
        if (typeof text === "string") {
          parts.push(text);
        }
      }
    }
  }

  return parts.join("\n").trim() || null;
}

export async function POST(request: Request) {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid chatbot request." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages.filter(isChatMessage).slice(-10) : [];
  const latestMessage = messages.at(-1);

  if (!latestMessage || latestMessage.role !== "user") {
    return NextResponse.json({ error: "Send a volunteer portal question to start chatting." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "The AI assistant is not configured yet. Add OPENAI_API_KEY on the server to enable chatbot responses.",
      },
      { status: 503 },
    );
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.AI_CHATBOT_MODEL || "gpt-4.1-mini",
      instructions:
        "You are the Alkhidmat Volunteer Management System assistant. Answer concise questions about using this app: browsing events, registering for events, attendance and QR scanning, volunteer profile, hours, certificates, badges, notifications, announcements, messaging, analytics where relevant, and navigation. Use only features present in the app. If you do not know, say so clearly. Do not invent official contact information or policies.",
      input: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      max_output_tokens: 350,
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "The AI assistant could not respond right now. Please try again later." },
      { status: 502 },
    );
  }

  const data: unknown = await response.json();
  const reply = getOutputText(data);

  if (!reply) {
    return NextResponse.json(
      { error: "The AI assistant returned an empty response. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ reply });
}
