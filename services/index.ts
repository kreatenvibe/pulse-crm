export { leadService } from "./lead.service";
export { customerService } from "./customer.service";
export { appointmentService } from "./appointment.service";
export { taskService } from "./task.service";
export { activityService } from "./activity.service";
export { noteService } from "./note.service";
export { serviceService } from "./service.service";
export { invoiceService } from "./invoice.service";
export { dashboardService } from "./dashboard.service";
export { reportService } from "./report.service";
export { userService } from "./user.service";
export { authService } from "./auth.service";

export type { CreateLeadInput, UpdateLeadInput } from "./lead.service";
export type {
  CreateCustomerInput,
  UpdateCustomerInput,
} from "./customer.service";
export type {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "./appointment.service";
export type { CreateTaskInput, UpdateTaskInput } from "./task.service";
export type {
  CreateActivityInput,
  UpdateActivityInput,
} from "./activity.service";
export type { CreateNoteInput, UpdateNoteInput } from "./note.service";
export type {
  CreateServiceInput,
  UpdateServiceInput,
} from "./service.service";
export type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
} from "./invoice.service";
export type { DashboardSummary, DashboardSummaryDto } from "@/types/dashboard";
export type { ReportSummary, ReportSummaryDto } from "@/types/report";
export type { AuthSession, SessionContext, LoginInput, SignupInput } from "./auth.service";
