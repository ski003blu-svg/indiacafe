import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

if (!ADMIN_PASSWORD) {
  logger.warn("ADMIN_PASSWORD is not set; admin login will not work");
}

const tokens = new Set<string>();

function sign(value: string): string {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(value)
    .digest("hex");
}

export function verifyPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  if (password.length !== ADMIN_PASSWORD.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(password),
      Buffer.from(ADMIN_PASSWORD),
    );
  } catch {
    return false;
  }
}

export function issueToken(): string {
  const random = crypto.randomBytes(24).toString("hex");
  const token = `${random}.${sign(random)}`;
  tokens.add(token);
  return token;
}

export function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  if (tokens.has(token)) return true;
  // Stateless verify (in case server restarted)
  const [random, sig] = token.split(".");
  if (!random || !sig) return false;
  try {
    const expected = sign(random);
    if (
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      tokens.add(token);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = req.header("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!isValidToken(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
