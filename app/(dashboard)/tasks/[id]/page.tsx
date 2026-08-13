"use client";

import Link from "next/link";
import { CalendarClock, UserRound } from "lucide-react";
import { useParams } from "next/navigation";
import {
  Button,
  DetailField,
  DetailHeader,
  DetailMeta,
  DetailSection,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "@/components/ui";
import { useCustomers, useLeads, useTasks, useUsers } from "@/hooks";
import { formatCustomerName, formatDate, formatLabel } from "@/lib/format";
import { TASK_PRIORITY_TONE, TASK_STATUS_TONE } from "@/lib/status-tone";

export default function TaskDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  // No dedicated task-details endpoint/hook exists; reuse the list hook and
  // resolve the single task by id (mirrors the existing tasks data-fetching).
  const { data: tasks, loading, error } = useTasks();
  const task = tasks.find((item) => item.id === id);

  // Resolve related ids to human names (same label conventions as the forms);
  // fall back to the id while lists load or if a record is missing.
  const { data: users } = useUsers();
  const { data: leads } = useLeads();
  const { data: customers } = useCustomers();

  const assignedToName =
    users.find((user) => user.id === task?.assignedTo)?.name ??
    task?.assignedTo;

  const related = task?.leadId
    ? (() => {
        const lead = leads.find((item) => item.id === task.leadId);
        const name = lead
          ? lead.company
            ? `${lead.name} — ${lead.company}`
            : lead.name
          : task.leadId;
        return { label: `Lead: ${name}`, href: `/leads/${task.leadId}` };
      })()
    : task?.customerId
      ? (() => {
          const customer = customers.find((item) => item.id === task.customerId);
          const name = customer
            ? formatCustomerName(customer)
            : task.customerId;
          return {
            label: `Customer: ${name}`,
            href: `/customers/${task.customerId}`,
          };
        })()
      : null;

  const isOverdue =
    !!task &&
    task.status !== "done" &&
    task.status !== "cancelled" &&
    new Date(task.dueDate).getTime() < Date.now();

  return (
    <div className="flex w-full flex-col">
      <DetailHeader
        backHref="/tasks"
        backLabel="Tasks"
        title={task?.title ?? id}
        badges={
          task ? (
            <>
              <StatusBadge tone={TASK_STATUS_TONE[task.status]}>
                {formatLabel(task.status)}
              </StatusBadge>
              <StatusBadge tone={TASK_PRIORITY_TONE[task.priority]}>
                {formatLabel(task.priority)}
              </StatusBadge>
              {isOverdue ? (
                <StatusBadge tone="danger">Overdue</StatusBadge>
              ) : null}
            </>
          ) : null
        }
        meta={
          task ? (
            <>
              <DetailMeta icon={<CalendarClock className="size-3.5" aria-hidden />}>
                <span className={isOverdue ? "text-danger" : undefined}>
                  Due {formatDate(task.dueDate)}
                </span>
              </DetailMeta>
              <DetailMeta icon={<UserRound className="size-3.5" aria-hidden />}>
                {assignedToName}
              </DetailMeta>
            </>
          ) : null
        }
        actions={
          task ? (
            <Link href={`/tasks/${id}/edit`}>
              <Button variant="primary">Edit task</Button>
            </Link>
          ) : null
        }
      />

      {loading ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <LoadingState message="Loading task…" />
        </div>
      ) : error ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <ErrorState message={error} />
        </div>
      ) : !task ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <EmptyState message="Task not found." />
        </div>
      ) : (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <DetailSection title="Task details" subtitle="Assignment and scheduling">
            <dl className="grid gap-4 px-5 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
            <DetailField label="Due date">
              <span className={isOverdue ? "text-danger" : undefined}>
                {formatDate(task.dueDate)}
              </span>
            </DetailField>
            <DetailField label="Assigned to">{assignedToName}</DetailField>
            <DetailField label="Related">
              {related ? (
                <Link
                  href={related.href}
                  className="text-brand hover:text-brand-hover hover:underline"
                >
                  {related.label}
                </Link>
              ) : (
                "—"
              )}
            </DetailField>
          </dl>

            {task.description ? (
              <div className="border-t border-border px-5 py-5 sm:px-6">
                <p className="text-xs font-medium text-foreground-muted">
                  Description
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">
                  {task.description}
                </p>
              </div>
            ) : null}
          </DetailSection>
        </div>
      )}
    </div>
  );
}
