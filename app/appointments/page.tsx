import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { Calendar } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  NO_SHOW: "No asistió",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SCHEDULED: "outline",
  CONFIRMED: "default",
  CANCELLED: "destructive",
  COMPLETED: "secondary",
  NO_SHOW: "destructive",
};

export default async function AppointmentsPage() {
  const now = new Date();

  const [upcoming, past] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: { gte: now }, status: { in: ["SCHEDULED", "CONFIRMED"] } },
      include: { patient: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { date: "asc" },
      take: 30,
    }),
    prisma.appointment.findMany({
      where: {
        OR: [
          { date: { lt: now } },
          { status: { in: ["CANCELLED", "COMPLETED", "NO_SHOW"] } },
        ],
      },
      include: { patient: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  const formatDate = (d: Date) =>
    new Date(d).toLocaleString("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const AppointmentCard = ({
    appt,
  }: {
    appt: (typeof upcoming)[number];
  }) => (
    <Card key={appt.id}>
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{appt.title}</CardTitle>
          <Badge variant={statusVariant[appt.status]}>{statusLabel[appt.status]}</Badge>
        </div>
        <Link
          href={`/patients/${appt.patient.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          {appt.patient.firstName} {appt.patient.lastName}
        </Link>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <span>{formatDate(appt.date)}</span>
        {appt.duration && (
          <span className="ml-3">· {appt.duration} min</span>
        )}
        {appt.description && <p className="mt-1">{appt.description}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Agenda de Citas</h1>
        <p className="text-muted-foreground">Próximas citas y historial</p>
      </div>

      {/* Upcoming */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Próximas ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Calendar className="h-10 w-10 mb-3 opacity-30" />
              <p>No hay citas próximas</p>
              <p className="text-sm mt-1">
                Ingresa al perfil de un{" "}
                <Link href="/patients" className="underline text-primary">
                  paciente
                </Link>{" "}
                para agendar una cita.
              </p>
            </CardContent>
          </Card>
        ) : (
          upcoming.map((a) => <AppointmentCard key={a.id} appt={a} />)
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Historial reciente ({past.length})
          </h2>
          {past.map((a) => (
            <AppointmentCard key={a.id} appt={a} />
          ))}
        </section>
      )}
    </div>
  );
}
