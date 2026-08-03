import type { Activity, ActivityDto } from "./activity";
import type { Appointment, AppointmentDto } from "./appointment";
import type { ID } from "./common";
import type { Customer, CustomerDto } from "./customer";
import type { Lead, LeadDto } from "./lead";
import type { Note, NoteDto } from "./note";
import type { Task, TaskDto } from "./task";

export type LeadAssignee = {
  id: ID;
  name: string;
};

/** Domain shape for a lead detail page. */
export type LeadDetails = {
  lead: Lead;
  assignedUser: LeadAssignee;
  activities: Activity[];
  notes: Note[];
  tasks: Task[];
  appointments: Appointment[];
};

/** Wire shape from `/api/leads/[id]/details`. */
export type LeadDetailsDto = {
  lead: LeadDto;
  assignedUser: LeadAssignee;
  activities: ActivityDto[];
  notes: NoteDto[];
  tasks: TaskDto[];
  appointments: AppointmentDto[];
};

export type ConvertLeadResult = {
  lead: Lead;
  customer: Customer;
};

export type ConvertLeadResultDto = {
  lead: LeadDto;
  customer: CustomerDto;
};
