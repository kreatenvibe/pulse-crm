import bcrypt from "bcryptjs";

/**
 * Password hashing for authentication. Uses `bcryptjs` (pure JS, no native
 * build step) rather than native `bcrypt` or a hand-rolled KDF — see
 * plan.md §7 for the comparison and rationale.
 */

const SALT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
