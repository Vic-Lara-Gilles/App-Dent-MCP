import { AddPaymentDialog } from "@/components/treatments/AddPaymentDialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { CreditCard } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  IN_PROGRESS: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export default async function TreatmentsPage() {
  const treatments = await prisma.treatment.findMany({
    include: {
      payments: true,
      patient: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const withBalance = treatments.map((t) => {
    const paid = t.payments.reduce((s, p) => s + Number(p.amount), 0);
    const balance = Math.max(0, Number(t.totalAmount) - paid);
    return { ...t, balance, paid };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tratamientos y Pagos</h1>
        <p className="text-muted-foreground">
          Gestión de bonos y abonos de todos los pacientes
        </p>
      </div>

      {withBalance.length === 0 ? (
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
          {withBalance.map((t) => (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">
                    {t.description}
                  </CardTitle>
                  <Badge variant={statusVariant[t.status]}>
                    {statusLabel[t.status]}
                  </Badge>
                </div>
                <Link
                  href={`/patients/${t.patient.id}`}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  {t.patient.firstName} {t.patient.lastName}
                </Link>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total: ${Number(t.totalAmount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-muted-foreground">
                    Pagado: ${t.paid.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                  <span className={t.balance > 0 ? "font-semibold text-red-600" : "font-semibold text-green-600"}>
                    Saldo: ${t.balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(100, (t.paid / Number(t.totalAmount)) * 100)}%`,
                    }}
                  />
                </div>
                {t.status === "IN_PROGRESS" && t.balance > 0 && (
                  <div className="mt-3 flex justify-end">
                    <AddPaymentDialog treatmentId={t.id} balance={t.balance} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
