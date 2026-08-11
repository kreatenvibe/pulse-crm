"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { TaskForm } from "@/components/tasks";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useTasks } from "@/hooks";

export default function EditTaskPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  // No dedicated task-details endpoint/hook exists; reuse the list hook and
  // resolve the single task by id (mirrors the existing tasks data-fetching).
  const { data: tasks, loading, error } = useTasks();
  const task = tasks.find((item) => item.id === id);

  return (
    <div className="flex w-full flex-col">
      <div className="border-b border-border px-5 py-5 sm:px-6 lg:px-8">
        <p className="text-sm text-foreground-muted">
          <Link
            href="/tasks"
            className="text-brand hover:text-brand-hover hover:underline"
          >
            Tasks
          </Link>
          <span className="mx-1.5 text-foreground-muted">/</span>
          <Link
            href={`/tasks/${id}`}
            className="text-brand hover:text-brand-hover hover:underline"
          >
            {task?.title ?? id}
          </Link>
          <span className="mx-1.5 text-foreground-muted">/</span>
          <span className="text-foreground-secondary">Edit</span>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Edit task
        </h1>
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
          <TaskForm
            mode="edit"
            task={task}
            onSuccess={() => router.push(`/tasks/${id}`)}
            onCancel={() => router.push(`/tasks/${id}`)}
          />
        </div>
      )}
    </div>
  );
}
