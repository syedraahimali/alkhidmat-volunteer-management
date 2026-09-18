import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Volunteer signup",
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-2xl p-6">
        <Link href="/" className="text-sm font-medium text-brand hover:underline">
          Alkhidmat Karachi
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-950">Create your volunteer account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your account is created through Supabase Auth. Passwords are never stored in the volunteers table.
        </p>
        <div className="mt-6">
          <SignupForm />
        </div>
      </Card>
    </main>
  );
}
