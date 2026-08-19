import { BaseEntity, type WithIsoDates } from "./common";

export interface Organization extends BaseEntity {
  name: string;
}

/** Organization as returned by the API (dates are ISO strings). */
export type OrganizationDto = WithIsoDates<Organization>;
