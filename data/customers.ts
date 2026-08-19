import type { Customer, CustomerLifecycleStatus } from "@/types/customer";
import { leads } from "./leads";
import { d, pad } from "./helpers";

const ADDRESSES = [
  "12 MG Road, Bengaluru, Karnataka 560001",
  "45 FC Road, Pune, Maharashtra 411004",
  "88 Park Street, Kolkata, West Bengal 700016",
  "3 Anna Salai, Chennai, Tamil Nadu 600002",
  "27 Banjara Hills Rd 2, Hyderabad, Telangana 500034",
  "9 Connaught Place, New Delhi 110001",
  "61 SG Highway, Ahmedabad, Gujarat 380054",
  "14 Marine Drive, Mumbai, Maharashtra 400020",
  "5 Panampilly Nagar, Kochi, Kerala 682036",
  "22 Civil Lines, Jaipur, Rajasthan 302006",
  "8 Sector 18, Noida, Uttar Pradesh 201301",
  "31 Law Garden, Ahmedabad, Gujarat 380006",
  "19 Koregaon Park, Pune, Maharashtra 411001",
  "7 Indiranagar 100 Feet Rd, Bengaluru 560038",
  "52 Salt Lake Sector V, Kolkata 700091",
  "11 T Nagar, Chennai, Tamil Nadu 600017",
  "4 Hitech City, Hyderabad, Telangana 500081",
  "66 Andheri West, Mumbai, Maharashtra 400058",
  "15 Jubilee Hills, Hyderabad 500033",
  "28 Whitefield Main, Bengaluru 560066",
] as const;

const LIFECYCLES: CustomerLifecycleStatus[] = [
  "onboarding",
  "active",
  "active",
  "active",
  "inactive",
  "churned",
];

// Scoped to org-001 so this generative derivation (and every downstream file
// that indexes into `customers` by position) stays exactly as it was before
// org-002 existed. org-002's converted lead gets a hand-authored customer below.
const convertedLeads = leads.filter(
  (l) => l.status === "converted" && l.organizationId === "org-001",
);

const org1Customers: Customer[] = convertedLeads.map((lead, i) => {
  const index = i + 1;
  const createdAt = d(
    `2026-${pad(2 + (i % 6), 2)}-${pad(5 + (i % 20), 2)}T14:${pad(i % 60, 2)}:00+05:30`,
  );

  return {
    id: `cust-${pad(index)}`,
    leadId: lead.id,
    businessName: lead.company,
    primaryContact: lead.name,
    phone: lead.phone,
    email: lead.email,
    address: ADDRESSES[i],
    assignedTo: lead.assignedTo,
    lifecycleStatus: LIFECYCLES[i % LIFECYCLES.length],
    organizationId: "org-001",
    createdAt,
    updatedAt: d(
      `2026-${pad(Math.min(8, 3 + (i % 6)), 2)}-${pad(1 + (i % 27), 2)}T11:00:00+05:30`,
    ),
  };
});

// --- org-002 fixtures ("Acme Field Services") — small, hand-authored, isolation-testing only. ---
const org2Customers: Customer[] = [
  {
    id: "cust-101",
    leadId: "lead-101",
    businessName: "Coral Bay Resorts",
    primaryContact: "Devika Rao",
    phone: "+91 90000 10001",
    email: "devika.rao@gmail.com",
    address: "2 Beach Road, Goa 403001",
    assignedTo: "user-102",
    lifecycleStatus: "onboarding",
    organizationId: "org-002",
    createdAt: d("2025-09-10T15:30:00+05:30"),
    updatedAt: d("2025-09-10T15:30:00+05:30"),
  },
];

export const customers: Customer[] = [...org1Customers, ...org2Customers];
