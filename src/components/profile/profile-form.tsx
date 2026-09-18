"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { updateProfileAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileFormProps = {
  profile?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    skills: string | null;
  } | null;
};

const initialState: AuthActionState = {};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" defaultValue={profile?.full_name ?? ""} autoComplete="name" required />
        {state.fieldErrors?.fullName ? <p className="text-sm text-red-700">{state.fieldErrors.fullName[0]}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={profile?.email ?? ""} readOnly aria-describedby="email-help" />
        <p id="email-help" className="text-xs text-slate-500">
          Email is managed by Supabase Auth.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={profile?.phone ?? ""} autoComplete="tel" required />
          {state.fieldErrors?.phone ? <p className="text-sm text-red-700">{state.fieldErrors.phone[0]}</p> : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={profile?.city ?? ""} required />
          {state.fieldErrors?.city ? <p className="text-sm text-red-700">{state.fieldErrors.city[0]}</p> : null}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="skills">Skills / interests</Label>
        <Input id="skills" name="skills" defaultValue={profile?.skills ?? ""} required />
        {state.fieldErrors?.skills ? <p className="text-sm text-red-700">{state.fieldErrors.skills[0]}</p> : null}
      </div>
      {state.message ? <p className={state.ok ? "text-sm text-brand" : "text-sm text-red-700"}>{state.message}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {pending ? "Saving profile" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
