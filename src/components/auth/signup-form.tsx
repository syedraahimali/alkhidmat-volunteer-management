"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { signupAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" autoComplete="name" required />
        {state.fieldErrors?.fullName ? <p className="text-sm text-red-700">{state.fieldErrors.fullName[0]}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        {state.fieldErrors?.email ? <p className="text-sm text-red-700">{state.fieldErrors.email[0]}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        {state.fieldErrors?.password ? <p className="text-sm text-red-700">{state.fieldErrors.password[0]}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" autoComplete="tel" required />
          {state.fieldErrors?.phone ? <p className="text-sm text-red-700">{state.fieldErrors.phone[0]}</p> : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue="Karachi" required />
          {state.fieldErrors?.city ? <p className="text-sm text-red-700">{state.fieldErrors.city[0]}</p> : null}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="skills">Skills / interests</Label>
        <Input id="skills" name="skills" placeholder="Food distribution, medical, logistics" required />
        {state.fieldErrors?.skills ? <p className="text-sm text-red-700">{state.fieldErrors.skills[0]}</p> : null}
      </div>
      {state.message ? <p className={state.ok ? "text-sm text-brand" : "text-sm text-red-700"}>{state.message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Create volunteer account
      </Button>
      <p className="text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link href="/auth/login" className="text-brand hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
