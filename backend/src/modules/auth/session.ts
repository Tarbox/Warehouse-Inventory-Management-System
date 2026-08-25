import { randomBytes } from "node:crypto";

// Generates a cryptographically secure random session ID.
// 32 bytes provide 256 bits of randomness.
// The result is encoded as hexadecimal for use as a string
export function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}