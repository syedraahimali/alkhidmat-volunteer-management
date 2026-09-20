"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Award,
  BarChart3,
  Bell,
  CalendarDays,
  HeartHandshake,
  LogOut,
  Megaphone,
  Menu,
  QrCode,
  Shield,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import type { AppRole } from "@/lib/database.types";

type AuthenticatedMobileNavigationProps = {
  userEmail?: string | null;
  isAdmin?: boolean;
  portal?: "volunteer" | "admin";
  userRoles?: AppRole[];
};

export function AuthenticatedMobileNavigation({ userEmail, isAdmin, portal, userRoles = [] }: AuthenticatedMobileNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activePortal = portal ?? (isAdmin ? "admin" : "volunteer");
  const isAdminPortal = activePortal === "admin";
  const canAccessAdmin = userRoles.some((role) => ["admin", "coordinator", "ngo_admin"].includes(role));
  const canAccessVolunteer = userRoles.includes("volunteer");
  const linkClassName = "flex min-h-12 items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-brand";
  const links = isAdminPortal
    ? [
        { href: "/admin", label: "Admin Dashboard", icon: CalendarDays },
        { href: "/admin/events", label: "Event Management", icon: CalendarDays },
        { href: "/admin/events/new", label: "Create New Event", icon: Shield },
        { href: "/admin/attendance", label: "Attendance", icon: QrCode },
        { href: "/admin/volunteers", label: "Volunteers", icon: UsersRound },
        { href: "/admin/certificates", label: "Certificates", icon: Award },
        { href: "/admin/communications", label: "Communications", icon: Megaphone },
        { href: "/admin/badges", label: "Badges", icon: Award },
        { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
        ...(canAccessVolunteer ? [{ href: "/dashboard", label: "Volunteer Portal", icon: HeartHandshake }] : []),
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: CalendarDays },
        { href: "/events", label: "Events", icon: CalendarDays },
        { href: "/profile", label: "Profile", icon: UserRound },
        { href: "/dashboard#notifications", label: "Notifications", icon: Bell },
        { href: "/dashboard#certificates", label: "Certificates/Badges", icon: Award },
        ...(canAccessAdmin ? [{ href: "/admin", label: "Admin Portal", icon: Shield }] : []),
      ];

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const mobileDrawer = (
    <div
      className={`fixed inset-0 z-40 h-[100dvh] lg:hidden ${mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!mobileMenuOpen}
    >
      <button
        type="button"
        className={`absolute inset-0 h-full w-full bg-slate-950/35 transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close navigation menu"
        onClick={() => setMobileMenuOpen(false)}
      />
      <aside
        className={`relative flex h-[100dvh] max-h-[100dvh] w-[min(21rem,calc(100vw-1.5rem))] flex-col overflow-hidden border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
              <HeartHandshake className="h-5 w-5" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-slate-950">Alkhidmat Karachi</p>
              <p className="truncate text-xs text-slate-500">{isAdminPortal ? "Admin Portal" : "Volunteer Portal"}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        {userEmail ? (
          <div className="shrink-0 border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
            <p className="truncate">{userEmail}</p>
          </div>
        ) : null}
        <nav className="grid flex-1 content-start gap-1 overflow-y-auto px-4 py-5">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={linkClassName}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            );
          })}
          <form action={logoutAction} className="mt-2 border-t border-slate-100 pt-2">
            <button type="submit" className={`${linkClassName} w-full text-left`} onClick={() => setMobileMenuOpen(false)}>
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </form>
        </nav>
      </aside>
    </div>
  );

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation menu"
        aria-expanded={mobileMenuOpen}
        onClick={() => setMobileMenuOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      {typeof document !== "undefined" ? createPortal(mobileDrawer, document.body) : null}
    </>
  );
}
