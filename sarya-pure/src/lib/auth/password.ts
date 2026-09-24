import "server-only";
import bcrypt from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Used to keep login timing constant when the email does not exist.
export const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5zG6oF0Yq5y1r3Q6k0Q9mKq7x8JwJ8a";
