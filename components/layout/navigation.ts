export type NavItem = {
  label: string;
  href: string;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

/** Primary workspace navigation, grouped for sidebar section headers. */
export const navGroups: NavGroup[] = [
  {
    id: "operations",
    label: "Sales operations",
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Leads", href: "/leads" },
      { label: "Customers", href: "/customers" },
      { label: "Appointments", href: "/appointments" },
      { label: "Tasks", href: "/tasks" },
      { label: "Services", href: "/services" },
      { label: "Invoices", href: "/invoices" },
    ],
  },
  {
    id: "insights",
    label: "Insights & management",
    items: [{ label: "Reports", href: "/reports" }],
  },
];

/** Flat list kept for any callers that need all main links. */
export const mainNavItems: NavItem[] = navGroups.flatMap((group) => group.items);

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
