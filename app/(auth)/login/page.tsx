import Link from "next/link";
import { Activity } from "lucide-react";
import { LoginForm } from "@/components/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-6 px-6 py-6">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded bg-brand text-foreground-inverse">
          <Activity className="size-5" aria-hidden />
        </span>
        <span className="text-lg font-bold tracking-tight text-brand">
          Pulse CRM
        </span>
      </Link>

      <div className="w-full max-w-sm rounded-xl border border-outline-variant bg-surface p-6 shadow-soft">
        <h1 className="mb-1 text-xl font-semibold tracking-tight">Log in</h1>
        <p className="mb-6 text-sm text-foreground-muted">
          Welcome back — enter your details to continue.
        </p>
        <LoginForm />
      </div>

      <p className="text-sm text-foreground-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
