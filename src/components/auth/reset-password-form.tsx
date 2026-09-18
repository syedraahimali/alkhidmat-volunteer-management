"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { resetPasswordAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        {state.fieldErrors?.password ? <p className="text-sm text-red-700">{state.fieldErrors.password[0]}</p> : null}
      </div>
      {state.message ? <p className={state.ok ? "text-sm text-brand" : "text-sm text-red-700"}>{state.message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Update password
      </Button>
      {state.ok ? (
        <Button asChild variant="outline">
          <Link href="/dashboard">Continue to dashboard</Link>
        </Button>
      ) : null}
    </form>
  );
}
