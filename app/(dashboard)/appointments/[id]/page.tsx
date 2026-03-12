import { AppointmentStatusButton } from "@/components/appointments/AppointmentStatusButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { prisma } from "@/lib/db";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

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

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { patient: true },
  });

  if (!appt) notFound();

  const apptDate = new Date(appt.date);
  const endDate = new Date(apptDate.getTime() + appt.duration * 60 * 1000);

  const reminderMsg = `Hola ${appt.patient.firstName}, le recordamos su cita el ${apptDate.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })} a las ${apptDate.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}. Duración aprox. ${appt.duration} min. ¡Le esperamos!`;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/appointments" className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold flex-1">{appt.title}</h1>
        <Badge variant={statusVariant[appt.status]}>{statusLabel[appt.status]}</Badge>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <Link href={`/patients/${appt.patient.id}`} className="font-medium hover:underline">
              {appt.patient.firstName} {appt.patient.lastName}
            </Link>
            <span className="text-sm text-muted-foreground">{appt.patient.phone}</span>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {apptDate.toLocaleDateString("es-CL", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {apptDate.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
              {" — "}
              {endDate.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="text-sm text-muted-foreground">({appt.duration} min)</span>
          </div>

          {appt.description && (
            <p className="text-sm text-muted-foreground border-t pt-3">{appt.description}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Acciones</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <AppointmentStatusButton
            appointmentId={appt.id}
            current={appt.status}
            onSuccess={() => { }}
          />
          <WhatsAppButton
            phone={appt.patient.phone}
            message={reminderMsg}
            label="Enviar Recordatorio"
          />
        </CardContent>
      </Card>
    </div>
  );
}
