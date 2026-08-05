"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  isNavItemActive,
  mainNavItems,
  settingsNavItem,
  type NavItem,
} from "./navigation";

type AppShellProps = {
  children: ReactNode;
};

const navIcons: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/leads": Activity,
  "/customers": Users,
  "/appointments": Calendar,
  "/tasks": ClipboardList,
  "/reports": BarChart3,
  "/settings": Settings,
};

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  function linkClass(href: string) {
    const active = isNavItemActive(pathname, href);
    return [
      "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
      active
        ? "bg-brand/20 font-medium text-sidebar-foreground-active"
        : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground-active",
    ].join(" ");
  }

  function renderLink(item: NavItem) {
    const active = isNavItemActive(pathname, item.href);
    const Icon = navIcons[item.href] ?? UserRound;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={linkClass(item.href)}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
      >
        {active ? (
          <span
            className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-brand"
            aria-hidden
          />
        ) : null}
        <Icon className="size-4 shrink-0" aria-hidden />
        {item.label}
      </Link>
    );
  }

  return (
    <>
      <nav
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
        aria-label="Main"
      >
        {mainNavItems.map(renderLink)}
      </nav>
      <div className="shrink-0 border-t border-sidebar-border pt-3">
        {renderLink(settingsNavItem)}
      </div>
    </>
  );
}

function Brand() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-sidebar-foreground-active"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-foreground-inverse">
        <Activity className="size-4" aria-hidden />
      </span>
      Pulse CRM
    </Link>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar lg:flex">
        <div className="shrink-0 border-b border-sidebar-border px-4 py-5">
          <Brand />
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-3 py-4">
          <NavLinks pathname={pathname} />
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
          <Brand />
          <button
            type="button"
            className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground-active"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-3 py-4">
          <NavLinks
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 lg:hidden">
          <button
            type="button"
            className="rounded-md p-2 text-foreground-secondary hover:bg-surface-muted"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <span className="text-sm font-semibold text-foreground">Pulse CRM</span>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
