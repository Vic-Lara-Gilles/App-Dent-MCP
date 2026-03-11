"use client";

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useRouter } from "next/navigation";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  patientName: string;
  status: string;
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "#6366f1",
  CONFIRMED: "#22c55e",
  COMPLETED: "#94a3b8",
  CANCELLED: "#ef4444",
  NO_SHOW: "#f97316",
};

interface Props {
  events: CalendarEvent[];
}

export function AppointmentCalendar({ events }: Props) {
  const router = useRouter();

  return (
    <div className="fc-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        locale="es"
        buttonText={{
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
        }}
        height="auto"
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        allDaySlot={false}
        events={events.map((e) => ({
          id: e.id,
          title: `${e.patientName} — ${e.title}`,
          start: e.start,
          end: e.end,
          backgroundColor: STATUS_COLORS[e.status] ?? "#6366f1",
          borderColor: STATUS_COLORS[e.status] ?? "#6366f1",
          extendedProps: { status: e.status },
        }))}
        eventClick={(info) => {
          router.push(`/appointments/${info.event.id}`);
        }}
      />
    </div>
  );
}
