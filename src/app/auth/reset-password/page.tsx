import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold text-slate-950">Choose a new password</h1>
        <p className="mt-2 text-sm text-slate-600">
          This page works after opening the reset link from your email.
        </p>
        <div className="mt-6">
          <ResetPasswordForm />
        </div>
      </Card>
    </main>
  );
}
