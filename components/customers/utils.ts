import type {
  CustomerDto,
  CustomerLifecycleStatus,
} from "@/types/customer";

export type { CustomerDto };

export const CUSTOMER_LIFECYCLE_STATUSES: CustomerLifecycleStatus[] = [
  "onboarding",
  "active",
  "inactive",
  "churned",
];

export type SortOrder = "newest" | "oldest";

export function filterCustomers(
  customers: CustomerDto[],
  options: {
    search: string;
    lifecycleStatus: CustomerLifecycleStatus | "";
    sort: SortOrder;
  },
): CustomerDto[] {
  const query = options.search.trim().toLowerCase();

  const filtered = customers.filter((customer) => {
    if (
      options.lifecycleStatus &&
      customer.lifecycleStatus !== options.lifecycleStatus
    ) {
      return false;
    }

    if (!query) return true;

    const haystack = [
      customer.primaryContact,
      customer.businessName,
      customer.email,
      customer.phone,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  return filtered.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return options.sort === "newest" ? bTime - aTime : aTime - bTime;
  });
}

export function formatMoney(amountCents: number, currency: string): string {
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}
