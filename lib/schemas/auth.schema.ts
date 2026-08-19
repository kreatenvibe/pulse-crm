import { z } from "zod";
import { requiredText } from "./fields";

/** Same field-level rules as every other `*.schema.ts` file (see AGENTS.md §5, §7). */

const emailField = z.email("Enter a valid email address").trim().toLowerCase();

// bcrypt silently truncates input over 72 bytes; reject it explicitly instead
// of hashing a truncated password.
const passwordField = z
  .string()
  .min(8, "password must be at least 8 characters")
  .max(72, "password must be at most 72 characters");

export const SignupSchema = z.object({
  name: requiredText("name"),
  email: emailField,
  password: passwordField,
  organizationName: requiredText("organizationName"),
});

export const LoginSchema = z.object({
  email: emailField,
  password: requiredText("password"),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
