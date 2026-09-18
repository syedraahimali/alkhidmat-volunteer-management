"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { createAnnouncementAction, type CommunityActionState } from "@/lib/community/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: CommunityActionState = {};

export function AnnouncementForm() {
  const [state, action, pending] = useActionState(createAnnouncementAction, initialState);
  return (
    <form action={action} className="grid gap-3 rounded-md border border-slate-200 p-4">
      <Input name="title" placeholder="Announcement title" required />
      <textarea name="body" placeholder="Announcement details" required className="min-h-28 rounded-md border border-slate-300 p-3 text-sm" />
      <select name="audience" defaultValue="all_volunteers" className="h-10 rounded-md border border-slate-300 px-3 text-sm">
        <option value="all_volunteers">All volunteers</option>
        <option value="registered_volunteers">Registered volunteers</option>
        <option value="approved_volunteers">Approved volunteers</option>
        <option value="public">Public</option>
      </select>
      <Button type="submit" disabled={pending}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{pending ? "Publishing" : "Publish announcement"}</Button>
      {state.message ? <p className={state.ok ? "text-sm text-brand" : "text-sm text-red-700"}>{state.message}</p> : null}
    </form>
  );
}
