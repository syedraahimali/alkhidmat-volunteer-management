import Link from "next/link";
import { Award, BarChart3, Bell, CalendarDays, ClipboardCheck, HeartHandshake, LogOut, Megaphone, QrCode, Shield, UserRound } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { AuthenticatedMobileNavigation } from "@/components/layout/authenticated-mobile-navigation";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string | null;
  isAdmin?: boolean;
};

export function AppShell({ children, userEmail, isAdmin }: AppShellProps) {
  const linkClassName = "flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <AuthenticatedMobileNavigation userEmail={userEmail} isAdmin={isAdmin} />
            <Link href="/dashboard" className="flex min-w-0 items-center gap-3 font-semibold text-slate-950">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
                <HeartHandshake className="h-5 w-5" />
              </span>
              <span className="truncate">Volunteer Portal</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-slate-500 md:inline">{userEmail}</span>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" aria-label="Log out">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:block">
          <nav className="grid gap-1 text-sm">
            <Link className={linkClassName} href={isAdmin ? "/admin" : "/dashboard"}>
              <CalendarDays className="h-4 w-4" /> {isAdmin ? "Admin Dashboard" : "Dashboard"}
            </Link>
            {isAdmin ? (
              <>
                <Link className={linkClassName} href="/admin/events">
                  <CalendarDays className="h-4 w-4" /> Event Management
                </Link>
                <Link className={linkClassName} href="/admin/events/new">
                  <Shield className="h-4 w-4" /> Create New Event
                </Link>
                <Link className={linkClassName} href="/admin/attendance">
                  <QrCode className="h-4 w-4" /> Attendance
                </Link>
                <Link className={linkClassName} href="/admin/certificates">
                  <Award className="h-4 w-4" /> Certificates
                </Link>
                <Link className={linkClassName} href="/admin/communications">
                  <Megaphone className="h-4 w-4" /> Communications
                </Link>
                <Link className={linkClassName} href="/admin/analytics">
                  <BarChart3 className="h-4 w-4" /> Analytics
                </Link>
                <Link className={linkClassName} href="/admin/registrations">
                  <ClipboardCheck className="h-4 w-4" /> Registrations
                </Link>
              </>
            ) : (
              <>
                <Link className={linkClassName} href="/events">
                  <CalendarDays className="h-4 w-4" /> Events
                </Link>
                <Link className={linkClassName} href="/profile">
                  <UserRound className="h-4 w-4" /> Profile
                </Link>
                <Link className={linkClassName} href="/dashboard#notifications">
                  <Bell className="h-4 w-4" /> Notifications
                </Link>
              </>
            )}
            <form action={logoutAction}>
              <button type="submit" className={`${linkClassName} w-full text-left`}>
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </form>
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
