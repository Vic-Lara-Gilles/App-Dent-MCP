"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PatientListItem } from "@/lib/types";
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
                  ${p.totalDebt.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </Badge>
              ) : (
                <Badge variant="secondary">Al día</Badge>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(p.createdAt).toLocaleDateString("es-MX")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
