import { customers } from "@/data/customers";
import { leads } from "@/data/leads";
import { services } from "@/data/services";
import { users } from "@/data/users";
import type { EntityType, ID } from "@/types/common";
import { ServiceError } from "./errors";

export function toDate(value: unknown, field: string): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new ServiceError(`Invalid date for ${field}`, "VALIDATION");
    }
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new ServiceError(`Invalid date for ${field}`, "VALIDATION");
    }
    return date;
  }

  throw new ServiceError(`${field} is required`, "VALIDATION");
}

export function toOptionalDate(
  value: unknown,
  field: string,
): Date | undefined {
  if (value === undefined || value === null) return undefined;
  return toDate(value, field);
}

export function assertRequiredString(
  value: unknown,
  field: string,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ServiceError(`${field} is required`, "VALIDATION");
  }
  return value.trim();
}

export function assertOptionalString(
  value: unknown,
  field: string,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new ServiceError(`${field} must be a string`, "VALIDATION");
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function assertEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ServiceError(
      `Invalid ${field}: expected one of ${allowed.join(", ")}`,
      "VALIDATION",
    );
  }
  return value as T;
}

export function assertOptionalEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): T | undefined {
  if (value === undefined || value === null) return undefined;
  return assertEnum(value, allowed, field);
}

export function assertUserId(value: unknown, field = "assignedTo"): ID {
  const id = assertRequiredString(value, field);
  if (!users.some((user) => user.id === id)) {
    throw new ServiceError(`Unknown user: ${id}`, "VALIDATION");
  }
  return id;
}

export function assertOptionalUserId(
  value: unknown,
  field: string,
): ID | undefined {
  if (value === undefined || value === null) return undefined;
  return assertUserId(value, field);
}

export function assertLeadId(value: unknown, field = "leadId"): ID {
  const id = assertRequiredString(value, field);
  if (!leads.some((lead) => lead.id === id)) {
    throw new ServiceError(`Unknown lead: ${id}`, "VALIDATION");
  }
  return id;
}

export function assertOptionalLeadId(
  value: unknown,
  field = "leadId",
): ID | undefined {
  if (value === undefined || value === null) return undefined;
  if (value === "") return undefined;
  return assertLeadId(value, field);
}

export function assertCustomerId(value: unknown, field = "customerId"): ID {
  const id = assertRequiredString(value, field);
  if (!customers.some((customer) => customer.id === id)) {
    throw new ServiceError(`Unknown customer: ${id}`, "VALIDATION");
  }
  return id;
}

export function assertOptionalCustomerId(
  value: unknown,
  field = "customerId",
): ID | undefined {
  if (value === undefined || value === null) return undefined;
  if (value === "") return undefined;
  return assertCustomerId(value, field);
}

export function assertServiceId(value: unknown, field = "serviceId"): ID {
  const id = assertRequiredString(value, field);
  if (!services.some((service) => service.id === id)) {
    throw new ServiceError(`Unknown service: ${id}`, "VALIDATION");
  }
  return id;
}

export function assertOptionalServiceId(
  value: unknown,
  field = "serviceId",
): ID | undefined {
  if (value === undefined || value === null) return undefined;
  if (value === "") return undefined;
  return assertServiceId(value, field);
}

export function assertEntityReference(
  entityType: EntityType,
  entityId: ID,
): void {
  const exists = (() => {
    switch (entityType) {
      case "lead":
        return leads.some((lead) => lead.id === entityId);
      case "customer":
        return customers.some((customer) => customer.id === entityId);
      case "appointment":
      case "task":
      case "service":
      case "invoice":
      case "note":
        return true;
      default:
        return false;
    }
  })();

  if (!exists) {
    throw new ServiceError(
      `Unknown ${entityType}: ${entityId}`,
      "VALIDATION",
    );
  }
}

export function assertTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new ServiceError("tags must be an array", "VALIDATION");
  }
  return value.map((tag, index) =>
    assertRequiredString(tag, `tags[${index}]`),
  );
}

export function assertPositiveNumber(
  value: unknown,
  field: string,
): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new ServiceError(`${field} must be a non-negative number`, "VALIDATION");
  }
  return value;
}

/** Exactly one of leadId or customerId must be set. */
export function assertLeadCustomerXor(
  leadId: ID | undefined,
  customerId: ID | undefined,
): { leadId?: ID; customerId?: ID } {
  const hasLead = Boolean(leadId);
  const hasCustomer = Boolean(customerId);

  if (hasLead && hasCustomer) {
    throw new ServiceError(
      "Provide either leadId or customerId, not both",
      "VALIDATION",
    );
  }

  if (!hasLead && !hasCustomer) {
    throw new ServiceError(
      "Exactly one of leadId or customerId is required",
      "VALIDATION",
    );
  }

  if (leadId) assertLeadId(leadId);
  if (customerId) assertCustomerId(customerId);

  return { leadId, customerId };
}

export function resolveLeadCustomerLink(
  input: { leadId?: ID; customerId?: ID },
  existing?: { leadId?: ID; customerId?: ID },
): { leadId?: ID; customerId?: ID } {
  const leadId =
    "leadId" in input ? input.leadId : existing?.leadId;
  const customerId =
    "customerId" in input ? input.customerId : existing?.customerId;

  return assertLeadCustomerXor(leadId, customerId);
}
