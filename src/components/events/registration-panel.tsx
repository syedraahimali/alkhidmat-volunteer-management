"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { registerForEventAction, type RegistrationActionState } from "@/lib/events/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const initialState: RegistrationActionState = {};

type RegistrationPanelProps = {
  eventId: string;
  registration: {
    status: string;
    registered_at: string;
  } | null;
  registrationOpen: boolean;
  profileLinked: boolean;
};

export function RegistrationPanel({ eventId, registration, registrationOpen, profileLinked }: RegistrationPanelProps) {
  const [state, formAction, pending] = useActionState(registerForEventAction, initialState);

  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Your registration</p>
      {registration ? (
        <>
          <p className="mt-2 text-xl font-semibold capitalize text-slate-950">{registration.status}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Submitted {new Date(registration.registered_at).toLocaleDateString()}. Registration changes are currently
            managed by the event coordinator.
          </p>
        </>
      ) : !profileLinked ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">Complete your volunteer profile before registering.</p>
      ) : registrationOpen ? (
        <>
          <p className="mt-2 text-lg font-semibold text-slate-950">Ready to volunteer?</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Submit your registration for coordinator review. Duplicate registrations are blocked by the database.
          </p>
          <form action={formAction} className="mt-4">
            <input type="hidden" name="eventId" value={eventId} />
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {pending ? "Submitting" : "Register for event"}
            </Button>
          </form>
        </>
      ) : (
        <p className="mt-2 text-sm leading-6 text-slate-600">Registration is closed for this event.</p>
      )}
      {state.message ? <p className={state.ok ? "mt-4 text-sm text-brand" : "mt-4 text-sm text-red-700"}>{state.message}</p> : null}
    </Card>
  );
}
