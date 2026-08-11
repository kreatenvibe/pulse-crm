"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "@/components/ui";
import { useCustomers, useLeads, useTasks, useUsers } from "@/hooks";
import { formatDate, formatLabel } from "@/lib/format";

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
            ? customer.businessName
              ? `${customer.businessName} — ${customer.primaryContact}`
              : customer.primaryContact
            : task.customerId;
          return {
            label: `Customer: ${name}`,
            href: `/customers/${task.customerId}`,
          };
        })()
      : null;

  return (
    <div className="flex w-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-5 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm text-foreground-muted">
            <Link
              href="/tasks"
              className="text-brand hover:text-brand-hover hover:underline"
            >
              Tasks
            </Link>
            <span className="mx-1.5 text-foreground-muted">/</span>
            <span className="text-foreground-secondary">
              {task?.title ?? id}
            </span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {task?.title ?? "Task details"}
          </h1>
        </div>
        {task ? (
          <Link href={`/tasks/${id}/edit`}>
            <Button>Edit task</Button>
          </Link>
        ) : null}
      </div>

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
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Status
              </dt>
              <dd className="mt-1">
                <StatusBadge>{formatLabel(task.status)}</StatusBadge>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Priority
              </dt>
              <dd className="mt-1">
                <StatusBadge>{formatLabel(task.priority)}</StatusBadge>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Due date
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {formatDate(task.dueDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Assigned to
              </dt>
              <dd className="mt-1 text-sm text-foreground">{assignedToName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Related
              </dt>
              <dd className="mt-1 text-sm text-foreground">
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
              </dd>
            </div>
            {task.description ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-foreground-muted">
                  Description
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                  {task.description}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      )}
    </div>
  );
}
