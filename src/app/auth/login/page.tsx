import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <Link href="/" className="text-sm font-medium text-brand hover:underline">
          Alkhidmat Karachi
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-950">Log in to your account</h1>
        <p className="mt-2 text-sm text-slate-600">Access your volunteer dashboard, events, attendance, and certificates.</p>
        <div className="mt-6">
          <LoginForm next={params.next} />
        </div>
      </Card>
    </main>
  );
}
