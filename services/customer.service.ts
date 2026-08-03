import { customers } from "@/data/customers";
import type { ID } from "@/types/common";
import type { Customer, CustomerLifecycleStatus } from "@/types/customer";
import { nextId, now } from "./helpers";

export type CreateCustomerInput = Omit<
  Customer,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateCustomerInput = Partial<CreateCustomerInput>;

class CustomerService {
  async getAll(): Promise<Customer[]> {
    return [...customers];
  }

  async getById(id: ID): Promise<Customer | null> {
    return customers.find((customer) => customer.id === id) ?? null;
  }

  async create(data: CreateCustomerInput): Promise<Customer> {
    const timestamp = now();
    const customer: Customer = {
      ...data,
      id: nextId("cust", customers),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    customers.push(customer);
    return customer;
  }

  async update(id: ID, data: UpdateCustomerInput): Promise<Customer | null> {
    const index = customers.findIndex((customer) => customer.id === id);
    if (index === -1) return null;

    const updated: Customer = {
      ...customers[index],
      ...data,
      id,
      updatedAt: now(),
    };
    customers[index] = updated;
    return updated;
  }

  async delete(id: ID): Promise<boolean> {
    const index = customers.findIndex((customer) => customer.id === id);
    if (index === -1) return false;
    customers.splice(index, 1);
    return true;
  }

  async getByLeadId(leadId: ID): Promise<Customer | null> {
    return customers.find((customer) => customer.leadId === leadId) ?? null;
  }

  async getByLifecycle(
    status: CustomerLifecycleStatus,
  ): Promise<Customer[]> {
    return customers.filter((customer) => customer.lifecycleStatus === status);
  }

  async getActive(): Promise<Customer[]> {
    return customers.filter(
      (customer) =>
        customer.lifecycleStatus === "active" ||
        customer.lifecycleStatus === "onboarding",
    );
  }

  async getByAssignee(userId: ID): Promise<Customer[]> {
    return customers.filter((customer) => customer.assignedTo === userId);
  }

  async search(query: string): Promise<Customer[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();

    return customers.filter((customer) => {
      const haystack = [
        customer.primaryContact,
        customer.businessName,
        customer.email,
        customer.phone,
        customer.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }
}

export const customerService = new CustomerService();
