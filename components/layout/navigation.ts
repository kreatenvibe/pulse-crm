export type NavItem = {
  label: string;
  href: string;
};

export const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Leads", href: "/leads" },
  { label: "Customers", href: "/customers" },
  { label: "Appointments", href: "/appointments" },
  { label: "Tasks", href: "/tasks" },
  { label: "Reports", href: "/reports" },
];

export const settingsNavItem: NavItem = {
  label: "Settings",
  href: "/settings",
};

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
