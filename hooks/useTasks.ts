"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import type { TaskDto } from "@/types/task";

const EMPTY_TASKS: TaskDto[] = [];

export function useTasks() {
  return useApiQuery<TaskDto[]>(
    "/api/tasks",
    EMPTY_TASKS,
    "Could not load tasks. Please try again.",
  );
}
