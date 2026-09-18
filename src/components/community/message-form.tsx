"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { sendMessageAction, type CommunityActionState } from "@/lib/community/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: CommunityActionState = {};

export function MessageForm({ eventId }: { eventId: string }) {
  const [state, action, pending] = useActionState(sendMessageAction, initialState);
  return (
    <form action={action} className="flex gap-2">
      <input type="hidden" name="eventId" value={eventId} />
      <Input name="body" placeholder="Ask a question about this event" required maxLength={2000} />
      <Button type="submit" disabled={pending} size="icon" aria-label="Send message">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
      {state.message ? <span className={state.ok ? "sr-only" : "text-xs text-red-700"}>{state.message}</span> : null}
    </form>
  );
}
