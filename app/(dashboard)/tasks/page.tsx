"use client";

import { useMemo, useState } from "react";
import {
  TaskFilters,
  TaskSummary,
  TaskTable,
  buildTaskLookups,
  countTasksByView,
  emptyMessageForView,
  enrichTask,
  filterTasks,
  type TaskViewMode,
} from "@/components/tasks";
import {
  ErrorState,
  LoadingState,
  Pagination,
} from "@/components/ui";
import { useCustomers, useLeads, useTasks } from "@/hooks";
import { DEFAULT_PAGE_SIZE, paginate } from "@/lib/pagination";
import type { TaskPriority, TaskStatus } from "@/types/task";

export default function TasksPage() {
  const { data: tasks, loading: tasksLoading, error: tasksError } = useTasks();
  const { data: leads, loading: leadsLoading, error: leadsError } = useLeads();
  const {
    data: customers,
    loading: customersLoading,
    error: customersError,
  } = useCustomers();

  const [viewMode, setViewMode] = useState<TaskViewMode>("open");
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [page, setPage] = useState(1);

  const filterKey = `${viewMode}\0${status}\0${priority}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const loading = tasksLoading || leadsLoading || customersLoading;
  const error = tasksError ?? leadsError ?? customersError;

  const lookups = useMemo(
    () => buildTaskLookups(leads, customers),
    [leads, customers],
  );

  const counts = useMemo(() => countTasksByView(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    const filtered = filterTasks(tasks, { viewMode, status, priority });
    return filtered.map((task) => enrichTask(task, lookups));
  }, [tasks, viewMode, status, priority, lookups]);

  const { data: pageTasks, pagination } = paginate(
    filteredTasks,
    page,
    DEFAULT_PAGE_SIZE,
  );

  if (pagination.page !== page) {
    setPage(pagination.page);
  }

  return (
    <div className="flex w-full flex-col gap-6 px-5 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Track follow-ups and to-dos across leads and customers.
        </p>
      </div>

      {loading ? (
        <LoadingState message="Loading tasks…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <TaskSummary counts={counts} />

          <TaskFilters
            viewMode={viewMode}
            status={status}
            priority={priority}
            onViewModeChange={setViewMode}
            onStatusChange={setStatus}
            onPriorityChange={setPriority}
          />

          <div className="flex flex-col gap-4">
            <TaskTable
              tasks={pageTasks}
              emptyMessage={emptyMessageForView(viewMode)}
            />
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
