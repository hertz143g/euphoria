import "server-only";

import { createHash, randomBytes, randomInt } from "node:crypto";

export function generateLoginCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashLoginCode(email: string, code: string): string {
  return createHash("sha256")
    .update(`${email.toLowerCase().trim()}:${code}`)
    .digest("hex");
}

export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}
