"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import type { UserDto } from "@/types/user";

const EMPTY_USERS: UserDto[] = [];

export function useUsers() {
  return useApiQuery<UserDto[]>(
    "/api/users",
    EMPTY_USERS,
    "Could not load users. Please try again.",
  );
}
