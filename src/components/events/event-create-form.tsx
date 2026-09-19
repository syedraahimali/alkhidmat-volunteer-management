"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createEventAction, type CreateEventActionState } from "@/lib/events/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CreateEventActionState = {};

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.[0] ? <p className="text-sm text-red-700">{messages[0]}</p> : null;
}

const textAreaClassName =
  "min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-teal-100";

const selectClassName =
  "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-teal-100";

export function EventCreateForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createEventAction, initialState);

  useEffect(() => {
    if (state.ok && state.eventId) {
      router.replace(`/admin/events?created=${state.eventId}`);
    }
  }, [router, state.eventId, state.ok]);

  return (
    <form action={formAction} className="grid gap-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="eventName">Event name</Label>
          <Input id="eventName" name="eventName" required />
          <FieldError messages={state.fieldErrors?.eventName} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" required />
          <FieldError messages={state.fieldErrors?.location} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="startTime">Start date/time</Label>
          <Input id="startTime" name="startTime" type="datetime-local" required />
          <FieldError messages={state.fieldErrors?.startTime} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endTime">End date/time</Label>
          <Input id="endTime" name="endTime" type="datetime-local" required />
          <FieldError messages={state.fieldErrors?.endTime} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="status">Event status</Label>
          <select id="status" name="status" defaultValue="upcoming" className={selectClassName}>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <FieldError messages={state.fieldErrors?.status} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="volunteerSlots">Capacity</Label>
          <Input id="volunteerSlots" name="volunteerSlots" type="number" min="0" inputMode="numeric" placeholder="Leave blank for flexible capacity" />
          <FieldError messages={state.fieldErrors?.volunteerSlots} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="registrationOpensAt">Registration opens</Label>
          <Input id="registrationOpensAt" name="registrationOpensAt" type="datetime-local" />
          <FieldError messages={state.fieldErrors?.registrationOpensAt} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="registrationClosesAt">Registration deadline</Label>
          <Input id="registrationClosesAt" name="registrationClosesAt" type="datetime-local" />
          <FieldError messages={state.fieldErrors?.registrationClosesAt} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="coordinatorName">Coordinator name</Label>
          <Input id="coordinatorName" name="coordinatorName" />
          <FieldError messages={state.fieldErrors?.coordinatorName} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="coordinatorContact">Coordinator contact</Label>
          <Input id="coordinatorContact" name="coordinatorContact" />
          <FieldError messages={state.fieldErrors?.coordinatorContact} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="certificateTitle">Certificate title</Label>
          <Input id="certificateTitle" name="certificateTitle" placeholder="Optional certificate name" />
          <FieldError messages={state.fieldErrors?.certificateTitle} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="certificateThresholdMinutes">Certificate threshold minutes</Label>
          <Input id="certificateThresholdMinutes" name="certificateThresholdMinutes" type="number" min="0" inputMode="numeric" placeholder="0" />
          <FieldError messages={state.fieldErrors?.certificateThresholdMinutes} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <textarea id="description" name="description" className={textAreaClassName} />
          <FieldError messages={state.fieldErrors?.description} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="taskRequirements">Task requirements</Label>
          <textarea id="taskRequirements" name="taskRequirements" className={textAreaClassName} />
          <FieldError messages={state.fieldErrors?.taskRequirements} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="skillsRequired">Skills required</Label>
          <textarea id="skillsRequired" name="skillsRequired" className={textAreaClassName} placeholder="Separate skills with commas" />
          <FieldError messages={state.fieldErrors?.skillsRequired} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="instructions">Volunteer instructions</Label>
          <textarea id="instructions" name="instructions" className={textAreaClassName} />
          <FieldError messages={state.fieldErrors?.instructions} />
        </div>
      </div>

      {state.message ? (
        <p className={state.ok ? "rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-brand" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"}>
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/events")} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create event
        </Button>
      </div>
    </form>
  );
}
