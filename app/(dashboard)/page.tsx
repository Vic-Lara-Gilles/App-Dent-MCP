import type { Prisma } from "@/app/generated/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AlertTriangle, Calendar, CreditCard, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  const dentistId = session?.dentistId || null;
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

  const dentistFilter: Prisma.TreatmentWhereInput = dentistId ? { dentistId } : {};
  const appointmentDentistFilter: Prisma.AppointmentWhereInput = dentistId ? { dentistId } : {};

  const [patientCount, treatmentCount, appointmentCount, todayPayments, activeTreatments, recentPayments] =
    await Promise.all([
      prisma.patient.count(dentistId ? { where: { treatments: { some: { dentistId } } } } : undefined),
      prisma.treatment.count({ where: { status: "IN_PROGRESS", ...dentistFilter } }),
      prisma.appointment.count({
        where: {
          date: { gte: new Date() },
          status: { in: ["SCHEDULED", "CONFIRMED"] },
          ...appointmentDentistFilter,
        },
      }),
      prisma.payment.findMany({
        where: {
          createdAt: { gte: todayStart },
          ...(dentistId ? { treatment: { dentistId } } : {}),
        },
      }),
      prisma.patient.findMany({
        where: {
          treatments: { some: { status: "IN_PROGRESS", ...dentistFilter } },
        },
        include: {
          treatments: {
            where: { status: "IN_PROGRESS", ...dentistFilter },
            include: { payments: { select: { amount: true } } },
          },
        },
      }),
      prisma.payment.findMany({
        where: dentistId ? { treatment: { dentistId } } : undefined,
        include: {
          treatment: {
            select: {
              description: true,
              patient: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  const incomesToday = todayPayments.reduce((s, p) => s + Number(p.amount), 0);

  // Compute debt per patient
  const debtors = activeTreatments
    .map((patient) => {
      const debt = patient.treatments.reduce((sum, t) => {
        const paid = t.payments.reduce((s, p) => s + Number(p.amount), 0);
        return sum + Math.max(0, Number((t as { totalAmount: unknown }).totalAmount) - paid);
      }, 0);
      return { id: patient.id, firstName: patient.firstName, lastName: patient.lastName, debt };
    })
    .filter((p) => p.debt > 0)
    .sort((a, b) => b.debt - a.debt)
    .slice(0, 5);

  const totalOutstanding = debtors.reduce((s, p) => s + p.debt, 0);

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
      value: `$${incomesToday.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      icon: CreditCard,
      href: "/treatments",
      color: "text-emerald-600",
    },
  ];

  const methodLabel: Record<string, string> = {
    CASH: "Efectivo",
    TRANSFER: "Transferencia",
    CARD: "Tarjeta",
    OTHER: "Otro",
  };

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
              ${totalOutstanding.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
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
                      ${p.debt.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
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
                        {pay.treatment.description} · {methodLabel[pay.method] ?? pay.method}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-green-600">
                        +${Number(pay.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(pay.createdAt).toLocaleDateString("es-MX")}
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

