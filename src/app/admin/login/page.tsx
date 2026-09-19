import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#0f766e_0%,#0f766e_34%,#f8fafc_34%,#f8fafc_100%)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[0.9fr_1fr]">
        <section className="text-white">
          <Link href="/" className="inline-flex items-center gap-3 text-white">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="font-semibold">Alkhidmat Volunteer Management</span>
          </Link>
          <h1 className="mt-8 text-4xl font-semibold tracking-normal">Admin / Coordinator Login</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-teal-50">
            Use your existing Supabase account. Access is granted only after your administrator or coordinator role is confirmed.
          </p>
        </section>
        <Card className="w-full p-6 shadow-lg sm:p-8">
          <p className="text-sm font-medium text-brand">Secure admin access</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Sign in to the admin area</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Volunteer accounts should use the normal volunteer login page.
          </p>
          <div className="mt-6">
            <AdminLoginForm next={params.next} />
          </div>
        </Card>
      </div>
    </main>
  );
}
