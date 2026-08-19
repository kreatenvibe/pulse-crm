import type { Organization } from "@/types/organization";
import { d } from "./helpers";

/**
 * org-001 is the default organization every pre-existing seed record belongs
 * to (matches the Milestone 1 backfill). org-002 is a second, deliberately
 * small tenant used to prove isolation once the service layer is org-scoped.
 */
export const organizations: Organization[] = [
  {
    id: "org-001",
    name: "Default Organization",
    createdAt: d("2025-06-01T09:00:00+05:30"),
    updatedAt: d("2025-06-01T09:00:00+05:30"),
  },
  {
    id: "org-002",
    name: "Acme Field Services",
    createdAt: d("2025-09-01T09:00:00+05:30"),
    updatedAt: d("2025-09-01T09:00:00+05:30"),
  },
];
