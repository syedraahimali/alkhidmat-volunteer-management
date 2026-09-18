"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { loginAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        {state.fieldErrors?.email ? <p className="text-sm text-red-700">{state.fieldErrors.email[0]}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
        {state.fieldErrors?.password ? <p className="text-sm text-red-700">{state.fieldErrors.password[0]}</p> : null}
      </div>
      {state.message ? <p className={state.ok ? "text-sm text-brand" : "text-sm text-red-700"}>{state.message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Log in
      </Button>
      <div className="flex items-center justify-between text-sm">
        <Link href="/auth/forgot-password" className="text-brand hover:underline">
          Forgot password?
        </Link>
        <Link href="/auth/signup" className="text-brand hover:underline">
          Create account
        </Link>
      </div>
    </form>
  );
}
