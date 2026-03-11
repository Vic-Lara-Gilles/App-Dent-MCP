import type { UserRole } from "@/app/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import type { JWTPayload } from "./jwt";
import { getSession } from "./session";

export interface AuthContext {
  userId: string;
  role: UserRole;
  dentistId: string | null;
}

type AuthHandler = (
  req: NextRequest,
  ctx: AuthContext & { params?: Record<string, string> }
) => Promise<NextResponse>;

export function withAuth(handler: AuthHandler, allowedRoles?: UserRole[]) {
  return async (req: NextRequest, routeCtx?: { params?: Promise<Record<string, string>> }) => {
    const session: JWTPayload | null = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (allowedRoles && !allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const params = routeCtx?.params ? await routeCtx.params : undefined;

    return handler(req, {
      userId: session.userId,
      role: session.role,
      dentistId: session.dentistId,
      params,
    });
  };
}
