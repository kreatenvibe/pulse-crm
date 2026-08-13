import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  Calendar,
  ChevronRight,
  Package,
  Receipt,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

export const metadata = {
  title: "Pulse CRM — Lead to invoice, one system",
  description:
    "Pulse CRM manages the complete customer journey — from first lead to paid invoice — in a single, focused workspace.",
};

// The pipeline Pulse CRM is built around, shown as a subtle workflow strip.
const WORKFLOW: { label: string; icon: LucideIcon }[] = [
  { label: "Lead", icon: UserPlus },
  { label: "Follow-up", icon: Bell },
  { label: "Appointment", icon: Calendar },
  { label: "Customer", icon: Users },
  { label: "Service", icon: Package },
  { label: "Invoice", icon: Receipt },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <header className="border-b border-outline-variant">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <span className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded bg-brand text-foreground-inverse">
              <Activity className="size-5" aria-hidden />
            </span>
            <span className="text-lg font-bold tracking-tight text-brand">
              Pulse CRM
            </span>
          </span>
          <Link
            href="/dashboard"
            className="hidden text-sm font-medium text-secondary transition-colors hover:text-brand sm:inline"
          >
            Open Dashboard
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-3 py-1 text-xs font-medium text-secondary">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden />
              Customer relationship management
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
              Manage the complete customer journey, from lead to invoice.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-secondary">
              Pulse CRM keeps leads, follow-ups, appointments, customers,
              services, and invoices in one focused workspace — so nothing slips
              between first contact and getting paid.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand bg-brand px-5 py-2.5 text-sm font-semibold text-foreground-inverse outline-none transition-colors hover:border-brand-hover hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                Open Dashboard
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>

          {/* Workflow strip — the pipeline Pulse CRM is built around. */}
          <div className="mt-20 border-t border-outline-variant pt-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              The workflow
            </p>
            <ol className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-3">
              {WORKFLOW.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.label} className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm font-medium text-on-surface">
                      <Icon className="size-4 text-brand" aria-hidden />
                      {step.label}
                    </span>
                    {index < WORKFLOW.length - 1 ? (
                      <ChevronRight
                        className="size-4 shrink-0 text-foreground-muted"
                        aria-hidden
                      />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </main>

      <footer className="border-t border-outline-variant">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-6">
          <p className="text-xs text-foreground-muted">
            Pulse CRM — customer relationship management for your team.
          </p>
        </div>
      </footer>
    </div>
  );
}
