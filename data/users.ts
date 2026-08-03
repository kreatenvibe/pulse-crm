import type { User } from "@/types/user";
import { d } from "./helpers";

export const users: User[] = [
  {
    id: "user-001",
    name: "Priya Sharma",
    email: "priya.sharma@pulsecrm.in",
    avatar: "/avatars/priya.jpg",
    role: "admin",
    isActive: true,
    createdAt: d("2025-06-01T09:00:00+05:30"),
    updatedAt: d("2026-07-15T11:20:00+05:30"),
  },
  {
    id: "user-002",
    name: "Arjun Mehta",
    email: "arjun.mehta@pulsecrm.in",
    avatar: "/avatars/arjun.jpg",
    role: "manager",
    isActive: true,
    createdAt: d("2025-06-01T09:05:00+05:30"),
    updatedAt: d("2026-07-20T16:00:00+05:30"),
  },
  {
    id: "user-003",
    name: "Ananya Reddy",
    email: "ananya.reddy@pulsecrm.in",
    role: "sales",
    isActive: true,
    createdAt: d("2025-07-10T10:00:00+05:30"),
    updatedAt: d("2026-08-01T09:30:00+05:30"),
  },
  {
    id: "user-004",
    name: "Vikram Patel",
    email: "vikram.patel@pulsecrm.in",
    role: "sales",
    isActive: true,
    createdAt: d("2025-08-15T10:00:00+05:30"),
    updatedAt: d("2026-07-28T14:10:00+05:30"),
  },
  {
    id: "user-005",
    name: "Sneha Iyer",
    email: "sneha.iyer@pulsecrm.in",
    role: "sales",
    isActive: false,
    createdAt: d("2025-09-01T10:00:00+05:30"),
    updatedAt: d("2026-06-30T18:00:00+05:30"),
  },
];
