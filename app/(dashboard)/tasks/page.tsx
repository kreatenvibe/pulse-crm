"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  Button,
  ErrorState,
  FilterBar,
  LoadingState,
  PageHeader,
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
    <div className="flex w-full flex-col">
      <PageHeader
        title="Tasks"
        description="Track follow-ups and to-dos across leads and customers."
        actions={
          <Link href="/tasks/new">
            <Button variant="primary">New task</Button>
          </Link>
        }
      />

      {loading ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <LoadingState message="Loading tasks…" />
        </div>
      ) : error ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <ErrorState message={error} />
        </div>
      ) : (
        <>
          <div className="border-b border-border px-5 py-6 sm:px-6 lg:px-8">
            <TaskSummary counts={counts} />
          </div>

          <FilterBar>
            <TaskFilters
              viewMode={viewMode}
              status={status}
              priority={priority}
              onViewModeChange={setViewMode}
              onStatusChange={setStatus}
              onPriorityChange={setPriority}
            />
          </FilterBar>

          <div className="flex flex-col">
            <div className="px-5 sm:px-6 lg:px-8">
              <TaskTable
                tasks={pageTasks}
                emptyMessage={emptyMessageForView(viewMode)}
              />
            </div>
            <div className="border-t border-border px-5 py-4 sm:px-6 lg:px-8">
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
