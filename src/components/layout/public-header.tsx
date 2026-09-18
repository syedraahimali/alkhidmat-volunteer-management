import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-slate-950">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold">Alkhidmat Karachi</span>
            <span className="block text-xs text-slate-500">Volunteer Portal</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          <Link href="/events" className="hover:text-brand">
            Events
          </Link>
          <Link href="/dashboard" className="hover:text-brand">
            Dashboard
          </Link>
          <Link href="/admin" className="hover:text-brand">
            Admin
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/auth/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/signup">Sign up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
