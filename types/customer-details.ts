import type { Activity, ActivityDto } from "./activity";
import type { Appointment, AppointmentDto } from "./appointment";
import type { ID } from "./common";
import type { Customer, CustomerDto } from "./customer";
import type { Invoice, InvoiceDto } from "./invoice";
import type { Note, NoteDto } from "./note";
import type { Service, ServiceDto } from "./service";
import type { Task, TaskDto } from "./task";

export type CustomerAssignee = {
  id: ID;
  name: string;
};

export type CustomerSourceLead = {
  id: ID;
  name: string;
};

/** Domain shape for a customer detail page. */
export type CustomerDetails = {
  customer: Customer;
  assignedUser: CustomerAssignee;
  sourceLead: CustomerSourceLead;
  activities: Activity[];
  notes: Note[];
  appointments: Appointment[];
  services: Service[];
  invoices: Invoice[];
  tasks: Task[];
};

/** Wire shape from `/api/customers/[id]/details`. */
export type CustomerDetailsDto = {
  customer: CustomerDto;
  assignedUser: CustomerAssignee;
  sourceLead: CustomerSourceLead;
  activities: ActivityDto[];
  notes: NoteDto[];
  appointments: AppointmentDto[];
  services: ServiceDto[];
  invoices: InvoiceDto[];
  tasks: TaskDto[];
};
