import { randomBytes } from "node:crypto";

export function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}