import { StatusBadge, type StatusBadgeTone } from "@/components/ui";
import { formatDate, formatLabel } from "@/lib/format";
import type { ServiceDto, ServiceStatus } from "@/types/service";

type CustomerServicesProps = {
  services: ServiceDto[];
};

const STATUS_TONE: Record<ServiceStatus, StatusBadgeTone> = {
  planned: "info",
  in_progress: "brand",
  completed: "success",
  cancelled: "neutral",
};

export function CustomerServices({ services }: CustomerServicesProps) {
  const sorted = [...services].sort((a, b) => {
    const aTime = a.scheduledDate
      ? new Date(a.scheduledDate).getTime()
      : new Date(a.createdAt).getTime();
    const bTime = b.scheduledDate
      ? new Date(b.scheduledDate).getTime()
      : new Date(b.createdAt).getTime();
    return bTime - aTime;
  });

  return (
    <section className="h-full">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-foreground">Services</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Jobs linked to this customer
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-foreground-muted sm:px-6">
          No services for this customer.
        </div>
      ) : (
        <ul>
          {sorted.map((service) => (
            <li
              key={service.id}
              className="border-b border-border px-5 py-3.5 last:border-b-0 sm:px-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {service.title}
                  </p>
                  {service.description ? (
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      {service.description}
                    </p>
                  ) : null}
                </div>
                <StatusBadge tone={STATUS_TONE[service.status]}>
                  {formatLabel(service.status)}
                </StatusBadge>
              </div>
              <p className="mt-1.5 text-xs text-foreground-muted">
                {service.scheduledDate
                  ? `Scheduled ${formatDate(service.scheduledDate)}`
                  : `Created ${formatDate(service.createdAt)}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
