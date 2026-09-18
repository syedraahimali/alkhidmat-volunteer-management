import Link from "next/link";
import { Bell, CalendarDays, HeartHandshake, LogOut, Shield, UserRound } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string | null;
  isAdmin?: boolean;
};

export function AppShell({ children, userEmail, isAdmin }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3 font-semibold text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
              <HeartHandshake className="h-5 w-5" />
            </span>
            <span>Volunteer Portal</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-slate-500 md:inline">{userEmail}</span>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <nav className="grid gap-1 text-sm">
            <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50" href="/dashboard">
              <CalendarDays className="h-4 w-4" /> Dashboard
            </Link>
            <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50" href="/events">
              <CalendarDays className="h-4 w-4" /> Events
            </Link>
            <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50" href="/profile">
              <UserRound className="h-4 w-4" /> Profile
            </Link>
            <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50" href="/dashboard#notifications">
              <Bell className="h-4 w-4" /> Notifications
            </Link>
            {isAdmin ? (
              <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50" href="/admin">
                <Shield className="h-4 w-4" /> Admin
              </Link>
            ) : null}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
