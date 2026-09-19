import Link from "next/link";
import { HeartHandshake } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:px-8">
        <section>
          <Link href="/" className="inline-flex items-center gap-3 text-slate-950">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white">
              <HeartHandshake className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold">Alkhidmat Karachi</span>
              <span className="block text-xs text-slate-500">Volunteer Portal</span>
            </span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
            A secure volunteer portal for event discovery, registration, QR attendance, certificates, badges, announcements, and impact tracking.
          </p>
        </section>

        <section className="border-t border-slate-100 pt-6 md:border-l md:border-t-0 md:pl-10 md:pt-0">
          <h2 className="text-sm font-semibold text-slate-950">Quick Links</h2>
          <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm md:grid md:grid-cols-2 md:gap-x-6">
            <Link href="/" className="text-slate-600 hover:text-brand">
              Home
            </Link>
            <Link href="/events" className="text-slate-600 hover:text-brand">
              Events
            </Link>
            <Link href="/auth/login" className="text-slate-600 hover:text-brand">
              Volunteer Login
            </Link>
            <Link href="/auth/signup" className="text-slate-600 hover:text-brand">
              Register
            </Link>
          </nav>
        </section>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>&copy; 2026 Alkhidmat Volunteer Management</p>
          <p className="font-medium text-brand">Volunteer Portal</p>
        </div>
      </div>
    </footer>
  );
}
