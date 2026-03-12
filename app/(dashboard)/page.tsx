import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { dashboardService } from "@/lib/services/dashboard.service";
import { AlertTriangle, Calendar, CreditCard, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  const dentistId = session?.dentistId || null;

  const {
    patientCount,
    treatmentCount,
    appointmentCount,
    incomesToday,
    debtors,
    totalOutstanding,
    recentPayments,
  } = await dashboardService.getStats(dentistId);

  const stats = [
    {
      title: "Pacientes",
      value: patientCount,
      icon: Users,
      href: "/patients",
      color: "text-blue-600",
    },
    {
      title: "Tratamientos Activos",
      value: treatmentCount,
      icon: AlertTriangle,
      href: "/treatments",
      color: "text-orange-600",
    },
    {
      title: "Citas Próximas",
      value: appointmentCount,
      icon: Calendar,
      href: "/appointments",
      color: "text-green-600",
    },
    {
      title: "Ingresos Hoy",
      value: `$${incomesToday.toLocaleString("es-CL", { minimumFractionDigits: 0 })}`,
      icon: CreditCard,
      href: "/treatments",
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general del consultorio</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Financial section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top debtors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Cuentas por Cobrar</CardTitle>
            <span className="text-sm font-semibold text-red-600">
              ${totalOutstanding.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
            </span>
          </CardHeader>
          <CardContent>
            {debtors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin saldos pendientes
              </p>
            ) : (
              <div className="space-y-3">
                {debtors.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <Link
                      href={`/patients/${p.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {p.firstName} {p.lastName}
                    </Link>
                    <span className="text-sm font-semibold text-red-600">
                      ${p.debt.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent payments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pagos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin pagos registrados
              </p>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((pay) => (
                  <div key={pay.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {pay.treatment.patient.firstName} {pay.treatment.patient.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {pay.treatment.description} · {PAYMENT_METHOD_LABEL[pay.method] ?? pay.method}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-green-600">
                        +${Number(pay.amount).toLocaleString("es-CL", { minimumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(pay.createdAt).toLocaleDateString("es-CL")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

