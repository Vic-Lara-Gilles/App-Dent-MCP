"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import type { PatientListItem } from "@/lib/types/patient";
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
    <div className="space-y-3">
      {patients.map((p) => (
        <Card key={p.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`/patients/${p.id}`}
                className="flex items-center gap-3 group min-w-0"
              >
                {p.avatarUrl ? (
                  <img
                    src={p.avatarUrl}
                    alt={`${p.firstName} ${p.lastName}`}
                    className="h-16 w-16 rounded-xl object-cover border border-border shrink-0"
                  />
                ) : (
                  <span className="h-16 w-16 rounded-xl bg-muted/60 border border-border flex items-center justify-center text-base font-bold text-muted-foreground shrink-0">
                    {p.firstName[0]}{p.lastName[0]}
                  </span>
                )}
                <div className="min-w-0">
                  <span className="text-base font-semibold group-hover:underline truncate block">
                    {p.firstName} {p.lastName}
                  </span>
                  {p.rut && (
                    <span className="text-sm text-muted-foreground block">
                      {p.rut}
                    </span>
                  )}
                </div>
              </Link>
              <div className="shrink-0">
                {p.totalDebt > 0 ? (
                  <Badge variant="destructive">
                    ${p.totalDebt.toLocaleString("es-CL")}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Al día</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-4 py-3">
              <div className="flex flex-1 flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 shrink-0" /> {p.phone}
                </span>
                {p.email && (
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0" /> {p.email}
                  </span>
                )}
              </div>
              <WhatsAppButton
                phone={p.phone}
                message={`Hola ${p.firstName}, le contactamos desde nuestra clínica dental.`}
                label="WhatsApp"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
