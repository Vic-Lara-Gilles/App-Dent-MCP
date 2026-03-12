import type { UserRole } from "@/app/generated/prisma/client";
import { SignJWT, jwtVerify } from "jose";

export interface JWTPayload {
  userId: string;
  role: UserRole;
  dentistId: string | null;
}

function getSecret() {
  const jwt = process.env.JWT_SECRET;
  if (!jwt) throw new Error("JWT_SECRET environment variable is required");
  return new TextEncoder().encode(jwt);
}

const EXPIRATION = "7d";

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
