"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
  ChevronRight,
  ClipboardList,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Receipt,
  Settings,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  isNavItemActive,
  mainNavItems,
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
    // Stitch nav item: rounded-lg row; active = red text/fill + right border.
    return [
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
      active
        ? "border-r-4 border-brand bg-brand-soft font-bold text-brand"
        : "text-secondary hover:bg-surface-container-low hover:text-on-surface",
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
        <Icon className="size-5 shrink-0 stroke-[1.5]" aria-hidden />
        {item.label}
      </Link>
    );
  }

  return (
    <>
      <nav
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4"
        aria-label="Main"
      >
        {navGroups.map((group) => group.items.map(renderLink))}
      </nav>

      <div className="mt-auto space-y-4 px-4 pt-4">
        {/* <Link
          href="/leads"
          onClick={onNavigate}
          className="flex w-full items-center justify-center gap-2 rounded bg-brand py-2 text-sm font-semibold text-foreground-inverse transition-colors hover:bg-brand-hover"
        >
          <Plus className="size-5" aria-hidden />
          New Lead
        </Link> */}

        <div className="space-y-1 border-t border-outline-variant pt-4">
          {renderLink(settingsNavItem)}
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-secondary transition-colors hover:bg-surface-container-low hover:text-on-surface"
          >
            <HelpCircle className="size-5 shrink-0 stroke-[1.5]" aria-hidden />
            Help
          </a>
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-secondary transition-colors hover:bg-surface-container-low hover:text-on-surface"
          >
            <LogOut className="size-5 shrink-0 stroke-[1.5]" aria-hidden />
            Logout
          </a>
        </div>
      </div>
    </>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3">
      <span className="flex size-8 items-center justify-center rounded bg-brand text-foreground-inverse">
        <Activity className="size-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-bold tracking-tight text-brand">
          Pulse CRM
        </span>
        {/* <span className="block text-[11px] font-semibold text-secondary">
          Enterprise Edition
        </span> */}
      </span>
    </Link>
  );
}

/** Breadcrumb trail derived from the active route (Stitch top app bar). */
function Breadcrumbs({ pathname }: { pathname: string }) {
  const current = [...mainNavItems, settingsNavItem].find((item) =>
    isNavItemActive(pathname, item.href),
  );

  return (
    <div className="flex items-center gap-2 text-xs font-medium text-secondary">
      <span>Pulse CRM</span>
      {current ? (
        <>
          <ChevronRight className="size-4 shrink-0" aria-hidden />
          <span className="text-on-surface">{current.label}</span>
        </>
      ) : null}
    </div>
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
      {/* Fixed 240px navigation, flush against the workspace edge */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-outline-variant bg-surface py-6 lg:flex">
        <div className="mb-8 px-6">
          <Brand />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <NavLinks pathname={pathname} />
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-inverse-surface/30 lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-outline-variant bg-surface py-6 transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >
        <div className="mb-8 flex items-center justify-between px-6">
          <Brand />
          <button
            type="button"
            className="rounded-lg p-2 text-secondary hover:bg-surface-container-low hover:text-on-surface"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-surface-container-lowest">
        {/* Stitch top app bar — breadcrumbs + quick actions */}
        <header className="sticky top-0 z-30 flex h-12 w-full items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-1.5 text-secondary hover:bg-surface-container-low hover:text-on-surface lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" aria-hidden />
            </button>
            <Breadcrumbs pathname={pathname} />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-secondary transition-colors hover:text-brand"
              aria-label="Notifications"
            >
              <Bell className="size-5 stroke-[1.5]" aria-hidden />
            </button>
            <button
              type="button"
              className="text-secondary transition-colors hover:text-brand"
              aria-label="History"
            >
              <History className="size-5 stroke-[1.5]" aria-hidden />
            </button>
            <span
              className="flex size-7 items-center justify-center rounded-full bg-secondary-container text-on-surface"
              aria-hidden
            >
              <UserRound className="size-4 stroke-[1.5]" />
            </span>
          </div>
        </header>

        {/* No horizontal padding — section dividers meet the sidebar border */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
