import { appointments } from "@/data/appointments";
import type { ID } from "@/types/common";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { nextId, now } from "./helpers";

export type CreateAppointmentInput = Omit<
  Appointment,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateAppointmentInput = Partial<CreateAppointmentInput>;

class AppointmentService {
  async getAll(): Promise<Appointment[]> {
    return [...appointments];
  }

  async getById(id: ID): Promise<Appointment | null> {
    return appointments.find((appointment) => appointment.id === id) ?? null;
  }

  async create(data: CreateAppointmentInput): Promise<Appointment> {
    const timestamp = now();
    const appointment: Appointment = {
      ...data,
      start: data.start instanceof Date ? data.start : new Date(String(data.start)),
      end: data.end instanceof Date ? data.end : new Date(String(data.end)),
      id: nextId("appt", appointments),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    appointments.push(appointment);
    return appointment;
  }

  async update(
    id: ID,
    data: UpdateAppointmentInput,
  ): Promise<Appointment | null> {
    const index = appointments.findIndex((appointment) => appointment.id === id);
    if (index === -1) return null;

    const updated: Appointment = {
      ...appointments[index],
      ...data,
      id,
      updatedAt: now(),
    };
    appointments[index] = updated;
    return updated;
  }

  async delete(id: ID): Promise<boolean> {
    const index = appointments.findIndex((appointment) => appointment.id === id);
    if (index === -1) return false;
    appointments.splice(index, 1);
    return true;
  }

  async getByStatus(status: AppointmentStatus): Promise<Appointment[]> {
    return appointments.filter((appointment) => appointment.status === status);
  }

  async getByLeadId(leadId: ID): Promise<Appointment[]> {
    return appointments.filter((appointment) => appointment.leadId === leadId);
  }

  async getByCustomerId(customerId: ID): Promise<Appointment[]> {
    return appointments.filter(
      (appointment) => appointment.customerId === customerId,
    );
  }

  async getByAssignee(userId: ID): Promise<Appointment[]> {
    return appointments.filter(
      (appointment) => appointment.assignedTo === userId,
    );
  }

  /** Future appointments that are still scheduled or confirmed. */
  async getUpcoming(from: Date = now()): Promise<Appointment[]> {
    return appointments
      .filter(
        (appointment) =>
          appointment.start >= from &&
          (appointment.status === "scheduled" ||
            appointment.status === "confirmed"),
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  async getInRange(from: Date, to: Date): Promise<Appointment[]> {
    return appointments
      .filter(
        (appointment) => appointment.start >= from && appointment.start <= to,
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }
}

export const appointmentService = new AppointmentService();
