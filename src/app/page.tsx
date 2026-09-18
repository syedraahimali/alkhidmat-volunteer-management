import Link from "next/link";
import { ArrowRight, CalendarDays, FileCheck2, QrCode, ShieldCheck } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  const features = [
    {
      title: "Central event calendar",
      description: "Browse Karachi volunteer opportunities with timings, location, requirements, and slot status.",
      icon: CalendarDays,
    },
    {
      title: "QR attendance",
      description: "Digital volunteer IDs and coordinator scanning create reliable check-in and check-out records.",
      icon: QrCode,
    },
    {
      title: "Automated certificates",
      description: "Eligible attendance can turn into verified downloadable certificates after event completion.",
      icon: FileCheck2,
    },
    {
      title: "Secure by design",
      description: "Supabase Auth, protected routes, row-level security, and role-aware admin workflows.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-medium text-brand">
                Volunteer Management System for Alkhidmat Karachi
              </p>
              <h1 className="text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
                Coordinate volunteers, attendance, certificates, and impact in one secure place.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                A production-ready foundation for public event discovery, volunteer onboarding, coordinator workflows,
                QR attendance, and reporting against your existing Supabase database.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/auth/signup">
                    Join as volunteer <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/events">Browse events</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} className="border-slate-200 p-5">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-brand">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-950">{feature.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Phase 1", "Auth, roles, Supabase configuration, protected routes, and migration foundation."],
              ["Database-first", "Existing volunteers, events, and attendance tables are preserved and extended safely."],
              ["Next steps", "Events, registration, admin tools, QR attendance, certificates, chat, badges, and analytics."],
            ].map(([title, body]) => (
              <div key={title} className="border-l-4 border-brand bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
