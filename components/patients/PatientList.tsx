"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PatientListItem } from "@/lib/types";
import { Mail, Phone } from "lucide-react";
import Link from "next/link";

export function PatientList({ patients }: { patients: PatientListItem[] }) {
  if (patients.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay pacientes registrados.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="md:hidden space-y-2">
        {patients.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/patients/${p.id}`}
                    className="font-medium hover:underline block truncate"
                  >
                    {p.firstName} {p.lastName}
                  </Link>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" /> {p.phone}
                    </span>
                    {p.email && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                        <Mail className="h-3 w-3 shrink-0" /> {p.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {p.totalDebt > 0 ? (
                    <Badge variant="destructive">
                      ${p.totalDebt.toLocaleString("es-CL")}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Al día</Badge>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(p.createdAt).toLocaleDateString("es-CL")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Saldo Pendiente</TableHead>
              <TableHead>Registrado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link
                    href={`/patients/${p.id}`}
                    className="font-medium hover:underline"
                  >
                    {p.firstName} {p.lastName}
                  </Link>
                </TableCell>
                <TableCell>{p.phone}</TableCell>
                <TableCell>{p.email || "—"}</TableCell>
                <TableCell className="text-right">
                  {p.totalDebt > 0 ? (
                    <Badge variant="destructive">
                      ${p.totalDebt.toLocaleString("es-CL")}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Al día</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(p.createdAt).toLocaleDateString("es-CL")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
