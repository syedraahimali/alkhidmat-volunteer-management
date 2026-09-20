"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { markEventCompletedAction, type EventCompletionActionState } from "@/lib/events/actions";
import { Button } from "@/components/ui/button";

type EventCompletionActionProps = {
  eventId: string;
};

const initialState: EventCompletionActionState = {};

export function EventCompletionAction({ eventId }: EventCompletionActionProps) {
  const [state, formAction, pending] = useActionState(markEventCompletedAction, initialState);
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      {state.ok ? <p className="w-full text-sm font-medium text-brand">{state.message}</p> : null}
      {!state.ok ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
          Mark as Completed
        </Button>
      ) : null}
      {!state.ok && state.message ? <p className="w-full text-sm text-red-700">{state.message}</p> : null}

      {confirming && !state.ok ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`complete-event-${eventId}`}
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <h2 id={`complete-event-${eventId}`} className="text-lg font-semibold text-slate-950">
              Mark this event as completed?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Once completed, volunteers will see this event as completed.
            </p>
            <form action={formAction} className="mt-6 flex flex-wrap justify-end gap-2">
              <input type="hidden" name="eventId" value={eventId} />
              <Button type="button" variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Mark as Completed
              </Button>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
