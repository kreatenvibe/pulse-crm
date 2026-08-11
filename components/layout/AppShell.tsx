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
  Package,
  Receipt,
  Settings,
  Users,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  isNavItemActive,
  navGroups,
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
  "/services": Package,
  "/invoices": Receipt,
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
      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
      active
        ? "bg-sidebar-active font-semibold text-sidebar-foreground-active"
        : "font-normal text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground-active",
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
        <Icon className="size-4 shrink-0 stroke-[1.5]" aria-hidden />
        {item.label}
      </Link>
    );
  }

  return (
    <>
      <nav
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto"
        aria-label="Main"
      >
        {navGroups.map((group) => (
          <div key={group.id} className="flex flex-col gap-0.5">
            <p className="px-2.5 pb-1.5 text-[10px] font-medium tracking-[0.08em] text-foreground-muted uppercase">
              {group.label}
            </p>
            {group.items.map(renderLink)}
          </div>
        ))}
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
      className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground"
    >
      <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-foreground-inverse">
        <Activity className="size-3.5" aria-hidden />
      </span>
      <span className="leading-tight">
        Pulse CRM
        <span className="mt-0.5 block text-[11px] font-normal text-foreground-muted">
          Workspace
        </span>
      </span>
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
      {/* ~16–18% width; flush against main — dividers meet this edge */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex xl:w-60">
        <div className="shrink-0 px-4 py-5">
          <Brand />
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-4">
          <NavLinks pathname={pathname} />
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between px-4 py-4">
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
        <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-4">
          <NavLinks
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-surface">
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

        {/* No horizontal padding — section dividers meet the sidebar border */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
