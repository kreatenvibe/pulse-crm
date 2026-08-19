import { prisma } from "@/lib/prisma";
import type { EntityType, ID } from "@/types/common";
import { ServiceError } from "./errors";

/**
 * DB-backed / business validation for the service layer. Pure input parsing
 * (required/optional strings, enums, dates, numbers, tags, create/update
 * shapes) lives in `lib/schemas/*` as Zod schemas and `./parse`; everything in
 * this file must query PostgreSQL, so it stays here.
 *
 * Every existence check below is org-scoped: `organizationId` is always the
 * first parameter, and every query filters `organization_id` alongside `id`
 * — this is what makes "assign a lead to another org's user" (etc.) a
 * `VALIDATION` error instead of a silent cross-tenant write. Milestone 5
 * introduced a parallel `assertOrgUserId` here because 5 services still
 * called the unscoped `assertUserId`; Milestone 6 scopes every remaining
 * service in the same pass, so that parallel function is gone — this file
 * now has exactly one (org-scoped) version of each helper.
 */

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
  organizationId: ID,
  value: unknown,
  field = "assignedTo",
): Promise<ID> {
  const id = requiredId(value, field);
  const exists = await prisma.users.findFirst({
    where: { id, organization_id: organizationId },
    select: { id: true },
  });
  if (!exists) {
    throw new ServiceError(`Unknown user: ${id}`, "VALIDATION");
  }
  return id;
}

export async function assertOptionalUserId(
  organizationId: ID,
  value: unknown,
  field: string,
): Promise<ID | undefined> {
  if (value === undefined || value === null) return undefined;
  return assertUserId(organizationId, value, field);
}

export async function assertLeadId(
  organizationId: ID,
  value: unknown,
  field = "leadId",
): Promise<ID> {
  const id = requiredId(value, field);
  const exists = await prisma.leads.findFirst({
    where: { id, organization_id: organizationId },
    select: { id: true },
  });
  if (!exists) {
    throw new ServiceError(`Unknown lead: ${id}`, "VALIDATION");
  }
  return id;
}

export async function assertOptionalLeadId(
  organizationId: ID,
  value: unknown,
  field = "leadId",
): Promise<ID | undefined> {
  if (value === undefined || value === null) return undefined;
  if (value === "") return undefined;
  return assertLeadId(organizationId, value, field);
}

export async function assertCustomerId(
  organizationId: ID,
  value: unknown,
  field = "customerId",
): Promise<ID> {
  const id = requiredId(value, field);
  const exists = await prisma.customers.findFirst({
    where: { id, organization_id: organizationId },
    select: { id: true },
  });
  if (!exists) {
    throw new ServiceError(`Unknown customer: ${id}`, "VALIDATION");
  }
  return id;
}

export async function assertOptionalCustomerId(
  organizationId: ID,
  value: unknown,
  field = "customerId",
): Promise<ID | undefined> {
  if (value === undefined || value === null) return undefined;
  if (value === "") return undefined;
  return assertCustomerId(organizationId, value, field);
}

export async function assertServiceId(
  organizationId: ID,
  value: unknown,
  field = "serviceId",
): Promise<ID> {
  const id = requiredId(value, field);
  const exists = await prisma.services.findFirst({
    where: { id, organization_id: organizationId },
    select: { id: true },
  });
  if (!exists) {
    throw new ServiceError(`Unknown service: ${id}`, "VALIDATION");
  }
  return id;
}

export async function assertOptionalServiceId(
  organizationId: ID,
  value: unknown,
  field = "serviceId",
): Promise<ID | undefined> {
  if (value === undefined || value === null) return undefined;
  if (value === "") return undefined;
  return assertServiceId(organizationId, value, field);
}

/**
 * Polymorphic `notes`/`activities` targets have no real FK (see
 * `prisma/schema.prisma` — no relation on `entity_type`/`entity_id`), so
 * Postgres cannot protect tenant isolation here; it is enforced entirely by
 * this org-scoped existence check against every real entity type, closing
 * the pre-existing gap where `appointment`/`task`/`service`/`invoice`/`note`
 * passed unconditionally (plan.md §10).
 */
export async function assertEntityReference(
  organizationId: ID,
  entityType: EntityType,
  entityId: ID,
): Promise<void> {
  let exists: boolean;
  switch (entityType) {
    case "lead":
      exists = Boolean(
        await prisma.leads.findFirst({
          where: { id: entityId, organization_id: organizationId },
          select: { id: true },
        }),
      );
      break;
    case "customer":
      exists = Boolean(
        await prisma.customers.findFirst({
          where: { id: entityId, organization_id: organizationId },
          select: { id: true },
        }),
      );
      break;
    case "appointment":
      exists = Boolean(
        await prisma.appointments.findFirst({
          where: { id: entityId, organization_id: organizationId },
          select: { id: true },
        }),
      );
      break;
    case "task":
      exists = Boolean(
        await prisma.tasks.findFirst({
          where: { id: entityId, organization_id: organizationId },
          select: { id: true },
        }),
      );
      break;
    case "service":
      exists = Boolean(
        await prisma.services.findFirst({
          where: { id: entityId, organization_id: organizationId },
          select: { id: true },
        }),
      );
      break;
    case "invoice":
      exists = Boolean(
        await prisma.invoices.findFirst({
          where: { id: entityId, organization_id: organizationId },
          select: { id: true },
        }),
      );
      break;
    case "note":
      exists = Boolean(
        await prisma.notes.findFirst({
          where: { id: entityId, organization_id: organizationId },
          select: { id: true },
        }),
      );
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
  organizationId: ID,
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

  if (leadId) await assertLeadId(organizationId, leadId);
  if (customerId) await assertCustomerId(organizationId, customerId);

  return { leadId, customerId };
}

export async function resolveLeadCustomerLink(
  organizationId: ID,
  input: { leadId?: ID; customerId?: ID },
  existing?: { leadId?: ID; customerId?: ID },
): Promise<{ leadId?: ID; customerId?: ID }> {
  const leadId = "leadId" in input ? input.leadId : existing?.leadId;
  const customerId =
    "customerId" in input ? input.customerId : existing?.customerId;

  return assertLeadCustomerXor(organizationId, leadId, customerId);
}
