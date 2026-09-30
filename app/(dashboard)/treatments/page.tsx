import { AddPaymentDialog } from "@/components/treatments/AddPaymentDialog";
import Image from "next/image";
import { PaymentDonut } from "@/components/treatments/PaymentDonut";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { calcBalance } from "@/lib/finance";
import { requireSession } from "@/lib/auth/session";
import { treatmentService } from "@/lib/services/treatment.service";
import { CreditCard } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TreatmentsPage() {
  const patients = await treatmentService.getOverview(await requireSession());

  // Find the first treatment with balance for AddPaymentDialog
  function firstWithBalance(group: (typeof patients)[0]) {
    for (const t of group.treatments) {
      const bal = calcBalance(t);
      if (bal > 0 && t.status === "IN_PROGRESS") return { id: t.id, balance: bal };
    }
    return null;
  }

  function overallStatus(group: (typeof patients)[0]) {
    if (group.treatments.some((t) => t.status === "CANCELLED")) return "mix";
    if (group.balance === 0) return "paid";
    return "pending";
  }

  const statusConfig: Record<string, { label: string; bg: string }> = {
    paid: { label: "Pagado", bg: "rgba(16,185,129,0.25)" },
    pending: { label: "Pendiente", bg: "rgba(245,158,11,0.25)" },
    mix: { label: "Parcial", bg: "rgba(244,63,94,0.25)" },
  };

  const statusText: Record<string, string> = {
    paid: "#6ee7b7",
    pending: "#fcd34d",
    mix: "#fda4af",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tratamientos y Pagos</h1>
        <p className="text-muted-foreground">
          Gestión de bonos y abonos de todos los pacientes
        </p>
      </div>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CreditCard className="h-10 w-10 mb-3 opacity-30" />
            <p>No hay tratamientos registrados</p>
            <p className="text-sm mt-1">
              Ingresa al perfil de un{" "}
              <Link href="/patients" className="underline text-primary">
                paciente
              </Link>{" "}
              para agregar un tratamiento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {patients.map((g) => {
            const status = overallStatus(g);
            const cfg = statusConfig[status];
            const payable = firstWithBalance(g);

            return (
              <Card key={g.patient.id}>
                {/* ── Cabecera: foto + nombre + rut + badge + abono ── */}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/patients/${g.patient.id}`}
                      className="flex items-center gap-3 group min-w-0"
                    >
                      {g.patient.avatarUrl ? (
                        <Image unoptimized width={128} height={128}
                          src={g.patient.avatarUrl}
                          alt={`${g.patient.firstName} ${g.patient.lastName}`}
                          className="h-16 w-16 rounded-xl object-cover border border-border shrink-0"
                        />
                      ) : (
                        <span className="h-16 w-16 rounded-xl bg-muted/60 border border-border flex items-center justify-center text-base font-bold text-muted-foreground shrink-0">
                          {g.patient.firstName[0]}{g.patient.lastName[0]}
                        </span>
                      )}
                      <div className="min-w-0">
                        <span className="text-base font-semibold group-hover:underline truncate block">
                          {g.patient.firstName} {g.patient.lastName}
                        </span>
                        {g.patient.rut && (
                          <span className="text-sm text-muted-foreground">
                            {g.patient.rut}
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md border border-white/10"
                        style={{ backgroundColor: cfg.bg, color: statusText[status] }}
                      >
                        {cfg.label}
                      </span>
                      {payable && (
                        <AddPaymentDialog treatmentId={payable.id} balance={payable.balance} />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* ── Contenido: dona + montos ── */}
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 rounded-lg bg-muted/40 px-4 py-3 -mt-2">
                    <PaymentDonut
                      paid={g.totalPaid}
                      balance={g.balance}
                      total={g.totalAmount}
                    />

                    <div className="flex flex-1 min-w-0 gap-4 text-sm">
                      <div className="flex flex-1 flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="font-semibold text-base">
                          ${g.totalAmount.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Pagado</span>
                        <span className="font-semibold text-base text-green-500">
                          ${g.totalPaid.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Saldo</span>
                        <span className={`font-semibold text-base ${g.balance > 0 ? "text-red-500" : "text-green-500"}`}>
                          ${g.balance.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
