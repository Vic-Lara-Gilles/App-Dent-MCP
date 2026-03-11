import type { UserRole } from "@/app/generated/prisma/client";
import { SignJWT, jwtVerify } from "jose";

export interface JWTPayload {
  userId: string;
  role: UserRole;
  dentistId: string | null;
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production"
);

const EXPIRATION = "7d";

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
