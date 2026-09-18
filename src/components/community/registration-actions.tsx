"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { updateRegistrationStatusAction, type CommunityActionState } from "@/lib/community/actions";
import { Button } from "@/components/ui/button";

const initialState: CommunityActionState = {};

export function RegistrationActions({ registrationId, status }: { registrationId: string; status: string }) {
  const [state, action, pending] = useActionState(updateRegistrationStatusAction, initialState);
  if (status !== "pending" && !state.message) return <span className="text-sm capitalize text-brand">{status}</span>;
  return <div className="flex flex-wrap items-center gap-2"><form action={action}><input type="hidden" name="registrationId" value={registrationId} /><input type="hidden" name="status" value="approved" /><Button size="sm" type="submit" disabled={pending}>{pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}Approve</Button></form><form action={action}><input type="hidden" name="registrationId" value={registrationId} /><input type="hidden" name="status" value="waitlisted" /><Button size="sm" variant="outline" type="submit" disabled={pending}>Waitlist</Button></form>{state.message ? <span className={state.ok ? "text-xs text-brand" : "text-xs text-red-700"}>{state.message}</span> : null}</div>;
}
