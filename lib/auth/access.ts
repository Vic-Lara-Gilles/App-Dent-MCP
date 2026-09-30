import type { AuthContext } from "./middleware";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export function dentistScope(auth: AuthContext): string | undefined {
  if (auth.role === "ADMIN") return undefined;
  if (auth.role !== "DENTIST" || !auth.dentistId) throw new ForbiddenError();
  return auth.dentistId;
}

export function requireAdmin(auth: AuthContext): void {
  dentistScope(auth);
  if (auth.role !== "ADMIN") throw new ForbiddenError();
}

export function assertOwned(auth: AuthContext, dentistId: string | null, resource: string): void {
  const scope = dentistScope(auth);
  if (scope && scope !== dentistId) throw new NotFoundError(resource);
}

export function assignedDentist(auth: AuthContext, requested?: string): string | undefined {
  const scope = dentistScope(auth);
  if (scope && requested && scope !== requested) throw new ForbiddenError();
  return scope ?? requested;
}
