"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import type { UserDto } from "@/types/user";

export function useCurrentUser() {
  return useApiQuery<UserDto | null>(
    "/api/auth/me",
    null,
    "Could not load the current user.",
  );
}
