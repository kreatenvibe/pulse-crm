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

const convertedLeads = leads.filter((l) => l.status === "converted");

export const customers: Customer[] = convertedLeads.map((lead, i) => {
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
    createdAt,
    updatedAt: d(
      `2026-${pad(Math.min(8, 3 + (i % 6)), 2)}-${pad(1 + (i % 27), 2)}T11:00:00+05:30`,
    ),
  };
});
