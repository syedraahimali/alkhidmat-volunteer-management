"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { adminLoginAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function AdminLoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(adminLoginAction, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="grid gap-2">
        <Label htmlFor="admin-email">Email</Label>
        <Input id="admin-email" name="email" type="email" autoComplete="email" required />
        {state.fieldErrors?.email ? <p className="text-sm text-red-700">{state.fieldErrors.email[0]}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="admin-password">Password</Label>
        <Input id="admin-password" name="password" type="password" autoComplete="current-password" required />
        {state.fieldErrors?.password ? <p className="text-sm text-red-700">{state.fieldErrors.password[0]}</p> : null}
      </div>
      {state.message ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        Login to admin area
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/auth/forgot-password" className="text-brand hover:underline">
          Forgot password?
        </Link>
        <Link href="/auth/login" className="text-brand hover:underline">
          Volunteer Login
        </Link>
      </div>
    </form>
  );
}
