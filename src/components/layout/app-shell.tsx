import Link from "next/link";
import {
  Award,
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardCheck,
  HeartHandshake,
  LogOut,
  Megaphone,
  QrCode,
  Shield,
  UserRound,
  UsersRound,
} from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { ChatbotWidget } from "@/components/chatbot/chatbot-widget";
import { AuthenticatedMobileNavigation } from "@/components/layout/authenticated-mobile-navigation";
import { Button } from "@/components/ui/button";
import type { AppRole } from "@/lib/database.types";
import { hasVolunteerRole, isAdminRole } from "@/lib/auth/session";

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string | null;
  isAdmin?: boolean;
  portal?: "volunteer" | "admin";
  userRoles?: AppRole[];
};

export function AppShell({ children, userEmail, isAdmin, portal, userRoles = [] }: AppShellProps) {
  const activePortal = portal ?? (isAdmin ? "admin" : "volunteer");
  const isAdminPortal = activePortal === "admin";
  const canAccessAdmin = isAdminRole(userRoles);
  const canAccessVolunteer = hasVolunteerRole(userRoles);
  const linkClassName = "flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50";
  const portalLabel = isAdminPortal ? "Admin Portal" : "Volunteer Portal";
  const homeHref = isAdminPortal ? "/admin" : "/dashboard";

  return (
    <div className={isAdminPortal ? "min-h-screen bg-slate-100" : "min-h-screen bg-background"}>
      <header className={isAdminPortal ? "border-b border-teal-900 bg-slate-950 text-white" : "border-b border-slate-200 bg-white"}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <AuthenticatedMobileNavigation userEmail={userEmail} portal={activePortal} userRoles={userRoles} />
            <Link href={homeHref} className={`flex min-w-0 items-center gap-3 font-semibold ${isAdminPortal ? "text-white" : "text-slate-950"}`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isAdminPortal ? "bg-white text-brand" : "bg-brand text-white"}`}>
                <HeartHandshake className="h-5 w-5" />
              </span>
              <span className="truncate">{portalLabel}</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {activePortal === "volunteer" && canAccessAdmin ? (
              <Button asChild variant="outline" size="sm" className="hidden border-teal-200 text-brand hover:bg-teal-50 sm:inline-flex">
                <Link href="/admin">Admin Portal</Link>
              </Button>
            ) : null}
            {activePortal === "admin" && canAccessVolunteer ? (
              <Button asChild variant="outline" size="sm" className="hidden border-teal-200 bg-white text-brand hover:bg-teal-50 sm:inline-flex">
                <Link href="/dashboard">Volunteer Portal</Link>
              </Button>
            ) : null}
            <span className={`hidden text-sm md:inline ${isAdminPortal ? "text-slate-300" : "text-slate-500"}`}>{userEmail}</span>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" aria-label="Log out" className={isAdminPortal ? "text-white hover:bg-white/10 hover:text-white" : ""}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className={`hidden rounded-lg border p-3 shadow-sm lg:block ${isAdminPortal ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
          <nav className="grid gap-1 text-sm">
            <Link className={isAdminPortal ? "flex items-center gap-2 rounded-md px-3 py-2 text-slate-100 hover:bg-white/10" : linkClassName} href={homeHref}>
              <CalendarDays className="h-4 w-4" /> {isAdminPortal ? "Admin Dashboard" : "Dashboard"}
            </Link>
            {isAdminPortal ? (
              <>
                <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-100 hover:bg-white/10" href="/admin/events">
                  <CalendarDays className="h-4 w-4" /> Event Management
                </Link>
                <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-100 hover:bg-white/10" href="/admin/events/new">
                  <Shield className="h-4 w-4" /> Create New Event
                </Link>
                <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-100 hover:bg-white/10" href="/admin/attendance">
                  <QrCode className="h-4 w-4" /> Attendance
                </Link>
                <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-100 hover:bg-white/10" href="/admin/volunteers">
                  <UsersRound className="h-4 w-4" /> Volunteers
                </Link>
                <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-100 hover:bg-white/10" href="/admin/certificates">
                  <Award className="h-4 w-4" /> Certificates
                </Link>
                <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-100 hover:bg-white/10" href="/admin/communications">
                  <Megaphone className="h-4 w-4" /> Communications
                </Link>
                <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-100 hover:bg-white/10" href="/admin/badges">
                  <Award className="h-4 w-4" /> Badges
                </Link>
                <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-100 hover:bg-white/10" href="/admin/analytics">
                  <BarChart3 className="h-4 w-4" /> Analytics
                </Link>
                <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-100 hover:bg-white/10" href="/admin/registrations">
                  <ClipboardCheck className="h-4 w-4" /> Registrations
                </Link>
                {canAccessVolunteer ? (
                  <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-100 hover:bg-white/10" href="/dashboard">
                    <HeartHandshake className="h-4 w-4" /> Volunteer Portal
                  </Link>
                ) : null}
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
                <Link className={linkClassName} href="/dashboard#certificates">
                  <Award className="h-4 w-4" /> Certificates/Badges
                </Link>
                {canAccessAdmin ? (
                  <Link className={linkClassName} href="/admin">
                    <Shield className="h-4 w-4" /> Admin Portal
                  </Link>
                ) : null}
              </>
            )}
            <form action={logoutAction}>
              <button type="submit" className={`${isAdminPortal ? "flex items-center gap-2 rounded-md px-3 py-2 text-slate-100 hover:bg-white/10" : linkClassName} w-full text-left`}>
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </form>
          </nav>
        </aside>
        <main>{children}</main>
      </div>
      <ChatbotWidget portal={activePortal} />
    </div>
  );
}
