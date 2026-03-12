"use client";

import { AppointmentCalendar } from "@/components/appointments/AppointmentCalendar";
import { AppointmentStatusButton } from "@/components/appointments/AppointmentStatusButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Appointment = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  duration: number;
  status: string;
  whatsappSent: boolean;
  patient: { id: string; firstName: string; lastName: string; phone: string };
};

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

function buildReminderMsg(appt: Appointment) {
  const d = new Date(appt.date);
  return `Hola ${appt.patient.firstName}, le recordamos su cita "${appt.title}" el ${d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })} a las ${d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}. Duración aprox. ${appt.duration} min. ¡Le esperamos!`;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [revision, setRevision] = useState(0);
  const [view, setView] = useState<"list" | "calendar">("list");

  const fetchAppointments = useCallback(() => setRevision((r) => r + 1), []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/appointments?limit=50")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setAppointments(d.data ?? []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Error al cargar citas");
      });
    return () => {
      cancelled = true;
    };
  }, [revision]);

  const loading = appointments === null;
  const list = appointments ?? [];
  const now = new Date();
  const upcoming = list.filter(
    (a) => new Date(a.date) >= now && ["SCHEDULED", "CONFIRMED"].includes(a.status)
  );
  const past = list.filter(
    (a) => new Date(a.date) < now || ["CANCELLED", "COMPLETED", "NO_SHOW"].includes(a.status)
  );

  const calendarEvents = list.map((a) => ({
    id: a.id,
    title: a.title,
    start: a.date,
    end: new Date(new Date(a.date).getTime() + a.duration * 60000).toISOString(),
    patientName: `${a.patient.firstName} ${a.patient.lastName}`,
    status: a.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda de Citas</h1>
          <p className="text-muted-foreground">Gestiona citas y envía recordatorios</p>
        </div>
        <div className="flex rounded-md border overflow-hidden text-sm">
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1.5 transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
          >
            Lista
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`px-3 py-1.5 transition-colors ${view === "calendar" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
          >
            Calendario
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-12 text-muted-foreground">Cargando...</p>
      ) : view === "calendar" ? (
        <Card>
          <CardContent className="pt-5 px-3 sm:px-5">
            <AppointmentCalendar events={calendarEvents} />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Upcoming */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold">
              Próximas <span className="text-muted-foreground font-normal">({upcoming.length})</span>
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay citas próximas. Ve al perfil de un paciente para agendar una.
              </p>
            ) : (
              upcoming.map((a) => (
                <Card key={a.id}>
                  <CardHeader className="pb-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/appointments/${a.id}`} className="font-semibold hover:underline">
                            {a.title}
                          </Link>
                          <Badge variant={statusVariant[a.status]}>{statusLabel[a.status]}</Badge>
                        </div>
                        <Link href={`/patients/${a.patient.id}`} className="text-sm text-muted-foreground hover:underline">
                          {a.patient.firstName} {a.patient.lastName}
                        </Link>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <WhatsAppButton phone={a.patient.phone} message={buildReminderMsg(a)} label="Recordatorio" />
                        <AppointmentStatusButton appointmentId={a.id} current={a.status} onSuccess={fetchAppointments} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {new Date(a.date).toLocaleString("es-CL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {a.duration} min
                    {a.description && <p className="mt-1">{a.description}</p>}
                  </CardContent>
                </Card>
              ))
            )}
          </section>

          {/* Past */}
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-muted-foreground">
                Historial <span className="font-normal">({past.length})</span>
              </h2>
              {past.map((a) => (
                <Card key={a.id} className="opacity-75">
                  <CardHeader className="pb-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/appointments/${a.id}`} className="font-semibold hover:underline">
                            {a.title}
                          </Link>
                          <Badge variant={statusVariant[a.status]}>{statusLabel[a.status]}</Badge>
                        </div>
                        <Link href={`/patients/${a.patient.id}`} className="text-sm text-muted-foreground hover:underline">
                          {a.patient.firstName} {a.patient.lastName}
                        </Link>
                      </div>
                      <AppointmentStatusButton appointmentId={a.id} current={a.status} onSuccess={fetchAppointments} />
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {new Date(a.date).toLocaleString("es-CL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {a.duration} min
                  </CardContent>
                </Card>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}


