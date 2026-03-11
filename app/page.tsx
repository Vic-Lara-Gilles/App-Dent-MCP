import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { AlertTriangle, Calendar, CreditCard, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [patientCount, treatmentCount, appointmentCount, payments] =
    await Promise.all([
      prisma.patient.count(),
      prisma.treatment.count({ where: { status: "IN_PROGRESS" } }),
      prisma.appointment.count({
        where: {
          date: { gte: new Date() },
          status: { in: ["SCHEDULED", "CONFIRMED"] },
        },
      }),
      prisma.payment.findMany({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

  const incomesToday = payments.reduce((s, p) => s + Number(p.amount), 0);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general del consultorio</p>
      </div>

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
    </div>
  );
}
