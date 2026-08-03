import { users } from "@/data/users";
import type { ID } from "@/types/common";
import type {
  ConvertLeadResult,
  LeadAssignee,
  LeadDetails,
} from "@/types/lead-details";
import type { Lead, LeadPriority, LeadSource, LeadStatus } from "@/types/lead";
import { leads } from "@/data/leads";
import { activityService } from "./activity.service";
import { appointmentService } from "./appointment.service";
import { customerService } from "./customer.service";
import { nextId, now } from "./helpers";
import { noteService } from "./note.service";
import { taskService } from "./task.service";

export type CreateLeadInput = Omit<Lead, "id" | "createdAt" | "updatedAt">;
export type UpdateLeadInput = Partial<CreateLeadInput>;

function resolveAssignee(userId: ID): LeadAssignee {
  const user = users.find((entry) => entry.id === userId);
  return {
    id: userId,
    name: user?.name ?? userId,
  };
}

class LeadService {
  async getAll(): Promise<Lead[]> {
    return [...leads];
  }

  async getById(id: ID): Promise<Lead | null> {
    return leads.find((lead) => lead.id === id) ?? null;
  }

  async getDetails(id: ID): Promise<LeadDetails | null> {
    const lead = await this.getById(id);
    if (!lead) return null;

    const [activities, notes, tasks, appointments] = await Promise.all([
      activityService.getTimeline("lead", id),
      noteService.getForEntity("lead", id),
      taskService.getByLeadId(id),
      appointmentService.getByLeadId(id),
    ]);

    return {
      lead,
      assignedUser: resolveAssignee(lead.assignedTo),
      activities,
      notes,
      tasks,
      appointments,
    };
  }

  async create(data: CreateLeadInput): Promise<Lead> {
    const timestamp = now();
    const lead: Lead = {
      ...data,
      id: nextId("lead", leads),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    leads.push(lead);
    return lead;
  }

  async update(id: ID, data: UpdateLeadInput): Promise<Lead | null> {
    const index = leads.findIndex((lead) => lead.id === id);
    if (index === -1) return null;

    const previous = leads[index];
    const updated: Lead = {
      ...previous,
      ...data,
      id,
      updatedAt: now(),
    };
    leads[index] = updated;

    if (data.status && data.status !== previous.status) {
      await activityService.create({
        entityType: "lead",
        entityId: id,
        type: "status_change",
        description: `Status changed from ${previous.status} to ${data.status}.`,
        performedBy: updated.assignedTo,
        timestamp: now(),
      });
    }

    return updated;
  }

  async delete(id: ID): Promise<boolean> {
    const index = leads.findIndex((lead) => lead.id === id);
    if (index === -1) return false;
    leads.splice(index, 1);
    return true;
  }

  /**
   * Convert a lead into a customer.
   * Idempotent if already converted and a customer exists for this lead.
   */
  async convert(id: ID): Promise<ConvertLeadResult> {
    const lead = await this.getById(id);
    if (!lead) {
      throw new Error("Lead not found");
    }

    const existingCustomer = await customerService.getByLeadId(id);
    if (lead.status === "converted" && existingCustomer) {
      return { lead, customer: existingCustomer };
    }

    if (existingCustomer) {
      const updated = await this.update(id, { status: "converted" });
      return { lead: updated!, customer: existingCustomer };
    }

    const customer = await customerService.create({
      leadId: lead.id,
      businessName: lead.company,
      primaryContact: lead.name,
      phone: lead.phone,
      email: lead.email,
      assignedTo: lead.assignedTo,
      lifecycleStatus: "onboarding",
    });

    const updated = await this.update(id, { status: "converted" });

    await activityService.create({
      entityType: "lead",
      entityId: id,
      type: "updated",
      description: `Lead converted to customer ${customer.id}.`,
      performedBy: lead.assignedTo,
      timestamp: now(),
    });

    return { lead: updated!, customer };
  }

  async getByStatus(status: LeadStatus): Promise<Lead[]> {
    return leads.filter((lead) => lead.status === status);
  }

  async getByAssignee(userId: ID): Promise<Lead[]> {
    return leads.filter((lead) => lead.assignedTo === userId);
  }

  async getBySource(source: LeadSource): Promise<Lead[]> {
    return leads.filter((lead) => lead.source === source);
  }

  async getByPriority(priority: LeadPriority): Promise<Lead[]> {
    return leads.filter((lead) => lead.priority === priority);
  }

  async search(query: string): Promise<Lead[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();

    return leads.filter((lead) => {
      const haystack = [
        lead.name,
        lead.email,
        lead.phone,
        lead.company,
        lead.message,
        ...lead.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }
}

export const leadService = new LeadService();
