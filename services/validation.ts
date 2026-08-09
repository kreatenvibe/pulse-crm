import type { ZodType } from "zod";
import { prisma } from "@/lib/prisma";
import type { EntityType, ID } from "@/types/common";
import { ServiceError } from "./errors";

/**
 * Pure input validation (required/optional strings, enums, dates, numbers,
 * tags, create/update shapes) now lives in `lib/schemas/*` as Zod schemas.
 * `parseInput` bridges a Zod validation failure to the existing `ServiceError`
 * contract so the API keeps returning `VALIDATION` (HTTP 400).
 *
 * Everything else in this file is DB-backed / business validation that must
 * query PostgreSQL, so it stays in the service layer.
 */

/** Parse raw input against a Zod schema, throwing `ServiceError("VALIDATION")`. */
export function parseInput<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join(".");
    const message = issue
      ? path
        ? `${path}: ${issue.message}`
        : issue.message
      : "Invalid input";
    throw new ServiceError(message, "VALIDATION");
  }
  return result.data;
}

/** Trim + require a string id before hitting the database. */
function requiredId(value: unknown, field: string): ID {
  if (typeof value !== "string" || !value.trim()) {
    throw new ServiceError(`${field} is required`, "VALIDATION");
  }
  return value.trim();
}

// Existence checks below query PostgreSQL through the shared Prisma client, so
// they stay correct for records created directly in the database (not just the
// original /data seed). They are async; callers must await them.

export async function assertUserId(
  value: unknown,
  field = "assignedTo",
): Promise<ID> {
  const id = requiredId(value, field);
  const exists = await prisma.users.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) {
    throw new ServiceError(`Unknown user: ${id}`, "VALIDATION");
  }
  return id;
}

export async function assertOptionalUserId(
  value: unknown,
  field: string,
): Promise<ID | undefined> {
  if (value === undefined || value === null) return undefined;
  return assertUserId(value, field);
}

export async function assertLeadId(
  value: unknown,
  field = "leadId",
): Promise<ID> {
  const id = requiredId(value, field);
  const exists = await prisma.leads.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) {
    throw new ServiceError(`Unknown lead: ${id}`, "VALIDATION");
  }
  return id;
}

export async function assertOptionalLeadId(
  value: unknown,
  field = "leadId",
): Promise<ID | undefined> {
  if (value === undefined || value === null) return undefined;
  if (value === "") return undefined;
  return assertLeadId(value, field);
}

export async function assertCustomerId(
  value: unknown,
  field = "customerId",
): Promise<ID> {
  const id = requiredId(value, field);
  const exists = await prisma.customers.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) {
    throw new ServiceError(`Unknown customer: ${id}`, "VALIDATION");
  }
  return id;
}

export async function assertOptionalCustomerId(
  value: unknown,
  field = "customerId",
): Promise<ID | undefined> {
  if (value === undefined || value === null) return undefined;
  if (value === "") return undefined;
  return assertCustomerId(value, field);
}

export async function assertServiceId(
  value: unknown,
  field = "serviceId",
): Promise<ID> {
  const id = requiredId(value, field);
  const exists = await prisma.services.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) {
    throw new ServiceError(`Unknown service: ${id}`, "VALIDATION");
  }
  return id;
}

export async function assertOptionalServiceId(
  value: unknown,
  field = "serviceId",
): Promise<ID | undefined> {
  if (value === undefined || value === null) return undefined;
  if (value === "") return undefined;
  return assertServiceId(value, field);
}

export async function assertEntityReference(
  entityType: EntityType,
  entityId: ID,
): Promise<void> {
  // Only lead/customer are real FK-backed entities we verify. The remaining
  // polymorphic targets (appointment, task, service, invoice, note) are not
  // existence-checked here — same as the original in-memory behavior.
  let exists: boolean;
  switch (entityType) {
    case "lead":
      exists = Boolean(
        await prisma.leads.findUnique({
          where: { id: entityId },
          select: { id: true },
        }),
      );
      break;
    case "customer":
      exists = Boolean(
        await prisma.customers.findUnique({
          where: { id: entityId },
          select: { id: true },
        }),
      );
      break;
    case "appointment":
    case "task":
    case "service":
    case "invoice":
    case "note":
      exists = true;
      break;
    default:
      exists = false;
  }

  if (!exists) {
    throw new ServiceError(`Unknown ${entityType}: ${entityId}`, "VALIDATION");
  }
}

/**
 * Exactly one of leadId or customerId must be set (shape), and the supplied id
 * must exist in PostgreSQL (existence). The exactly-one shape rule is kept here
 * with the existence check because they are validated together and, on update,
 * against the existing record via `resolveLeadCustomerLink`.
 */
export async function assertLeadCustomerXor(
  leadId: ID | undefined,
  customerId: ID | undefined,
): Promise<{ leadId?: ID; customerId?: ID }> {
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

  if (leadId) await assertLeadId(leadId);
  if (customerId) await assertCustomerId(customerId);

  return { leadId, customerId };
}

export async function resolveLeadCustomerLink(
  input: { leadId?: ID; customerId?: ID },
  existing?: { leadId?: ID; customerId?: ID },
): Promise<{ leadId?: ID; customerId?: ID }> {
  const leadId = "leadId" in input ? input.leadId : existing?.leadId;
  const customerId =
    "customerId" in input ? input.customerId : existing?.customerId;

  return assertLeadCustomerXor(leadId, customerId);
}
