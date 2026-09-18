import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <Link href="/auth/login" className="text-sm font-medium text-brand hover:underline">
          Back to login
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-950">Reset your password</h1>
        <p className="mt-2 text-sm text-slate-600">Enter your account email and we will send reset instructions.</p>
        <div className="mt-6">
          <ForgotPasswordForm />
        </div>
      </Card>
    </main>
  );
}
