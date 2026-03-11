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
import type { DentistListItem } from "@/hooks/use-dentists";

export function DentistList({ dentists }: { dentists: DentistListItem[] }) {
  if (dentists.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se encontraron dentistas.
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
          <TableHead>Especialidad</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dentists.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium">
              {d.firstName} {d.lastName}
            </TableCell>
            <TableCell>{d.phone}</TableCell>
            <TableCell className="text-muted-foreground">
              {d.email || "—"}
            </TableCell>
            <TableCell>
              {d.specialty ? (
                <Badge variant="secondary">{d.specialty}</Badge>
              ) : (
                <span className="text-muted-foreground">General</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
