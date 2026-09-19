"use client";

import { FormEvent, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const starterMessage: ChatMessage = {
  id: "starter",
  role: "assistant",
  content: "Hi. I can help with events, registration, QR attendance, profiles, hours, certificates, badges, notifications, and portal navigation.",
};

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => message.id !== "starter")
            .map(({ role, content }) => ({ role, content })),
        }),
      });
      const data: unknown = await response.json();
      const payload = data && typeof data === "object" ? (data as { reply?: unknown; error?: unknown }) : {};
      const reply = payload.reply;

      if (!response.ok || typeof reply !== "string") {
        throw new Error(typeof payload.error === "string" ? payload.error : "The assistant could not respond.");
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
        },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The assistant could not respond.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {open ? (
        <section className="flex h-[min(620px,calc(100vh-2rem))] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-brand">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-950">Volunteer Assistant</h2>
                <p className="text-xs text-slate-500">Portal help and navigation</p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label="Close chatbot" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-6 ${
                  message.role === "user"
                    ? "ml-auto bg-brand text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {message.content}
              </div>
            ))}
            {loading ? (
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin text-brand" />
                Typing
              </div>
            ) : null}
          </div>

          {error ? <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div> : null}

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm text-slate-950 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-teal-100"
              placeholder="Ask about using the portal"
              aria-label="Ask the volunteer assistant"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send message">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </section>
      ) : (
        <Button
          type="button"
          size="lg"
          className="h-14 rounded-full px-5 shadow-xl"
          aria-label="Open volunteer assistant chatbot"
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="h-5 w-5" />
          Help
        </Button>
      )}
    </div>
  );
}
