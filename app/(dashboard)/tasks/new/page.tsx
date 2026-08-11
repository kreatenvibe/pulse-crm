"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TaskForm } from "@/components/tasks";

export default function NewTaskPage() {
  const router = useRouter();

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
          <span className="text-foreground-secondary">New task</span>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          New task
        </h1>
      </div>

      <div className="px-5 py-6 sm:px-6 lg:px-8">
        <TaskForm
          mode="create"
          onSuccess={() => router.push("/tasks")}
          onCancel={() => router.push("/tasks")}
        />
      </div>
    </div>
  );
}
