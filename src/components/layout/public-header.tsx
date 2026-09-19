"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HeartHandshake, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const publicLinks = [
    { href: "/", label: "Home" },
    { href: "/events", label: "Events" },
    { href: "/auth/login", label: "Volunteer Login" },
    { href: "/auth/signup", label: "Register" },
    { href: "/admin/login", label: "Admin Login" },
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
      className={`fixed inset-0 z-40 h-[100dvh] md:hidden ${mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
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
        <div className="flex min-h-[72px] shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-3 text-slate-950" onClick={() => setMobileMenuOpen(false)}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
              <HeartHandshake className="h-5 w-5" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold">Alkhidmat Karachi</span>
              <span className="block truncate text-xs text-slate-500">Volunteer Portal</span>
            </span>
          </Link>
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
        <nav className="grid flex-1 content-start gap-2 overflow-y-auto px-4 py-5 text-sm font-medium text-slate-700">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-12 items-center rounded-md px-3 py-3 hover:bg-teal-50 hover:text-brand"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3 text-slate-950">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
              <HeartHandshake className="h-5 w-5" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold">Alkhidmat Karachi</span>
              <span className="block truncate text-xs text-slate-500">Volunteer Portal</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
            <Link href="/" className="hover:text-brand">
              Home
            </Link>
            <Link href="/events" className="hover:text-brand">
              Events
            </Link>
            <Link href="/auth/login" className="hover:text-brand">
              Volunteer Login
            </Link>
            <Link href="/auth/signup" className="hover:text-brand">
              Register
            </Link>
            <Link href="/admin/login" className="hover:text-brand">
              Admin Login
            </Link>
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/auth/login">Volunteer Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Register</Link>
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 md:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>
      {typeof document !== "undefined" ? createPortal(mobileDrawer, document.body) : null}
    </>
  );
}
