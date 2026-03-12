"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  patientName: string;
  status: string;
};

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  SCHEDULED: { bg: "rgba(99,102,241,0.18)", border: "rgba(99,102,241,0.55)", text: "#a5b4fc" },
  CONFIRMED: { bg: "rgba(34,197,94,0.18)", border: "rgba(34,197,94,0.55)", text: "#86efac" },
  COMPLETED: { bg: "rgba(148,163,184,0.14)", border: "rgba(148,163,184,0.40)", text: "#94a3b8" },
  CANCELLED: { bg: "rgba(239,68,68,0.16)", border: "rgba(239,68,68,0.50)", text: "#fca5a5" },
  NO_SHOW: { bg: "rgba(249,115,22,0.16)", border: "rgba(249,115,22,0.50)", text: "#fdba74" },
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
const HOUR_H = 72;

interface Props {
  events: CalendarEvent[];
}

export function AppointmentCalendar({ events }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<"week" | "day">("day");

  const prev = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - (view === "week" ? 7 : 1));
    setDate(d);
  };
  const next = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + (view === "week" ? 7 : 1));
    setDate(d);
  };
  const goToday = () => setDate(new Date());

  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const isToday = (d: Date) => same(d, new Date());

  const weekDays = useMemo(() => {
    const d = new Date(date);
    const dow = d.getDay();
    d.setDate(d.getDate() - ((dow === 0 ? 7 : dow) - 1));
    d.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(d);
      day.setDate(day.getDate() + i);
      return day;
    });
  }, [date]);

  const eventsFor = (d: Date) =>
    events.filter((e) => same(new Date(e.start), d));

  function pos(ev: CalendarEvent) {
    const s = new Date(ev.start);
    const e = new Date(ev.end);
    const sh = s.getHours() + s.getMinutes() / 60;
    const eh = e.getHours() + e.getMinutes() / 60;
    return { top: (sh - 7) * HOUR_H, height: Math.max((eh - sh) * HOUR_H, 30) };
  }

  function hm(d: string) {
    const t = new Date(d);
    return `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}`;
  }

  const title =
    view === "day"
      ? date.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })
      : `${weekDays[0].getDate()} – ${weekDays[6].getDate()} ${weekDays[6].toLocaleDateString("es-CL", { month: "short", year: "numeric" })}`;

  /* ── Event card ── */
  function Ev({ ev, compact }: { ev: CalendarEvent; compact?: boolean }) {
    const c = STATUS_STYLE[ev.status] ?? STATUS_STYLE.SCHEDULED;
    const p = pos(ev);
    return (
      <button
        onClick={() => router.push(`/appointments/${ev.id}`)}
        className="absolute left-0.5 right-0.5 rounded-lg px-2 py-1 text-left cursor-pointer transition-all hover:brightness-125 hover:scale-[1.02] backdrop-blur-sm overflow-hidden z-10"
        style={{
          top: p.top,
          height: p.height,
          backgroundColor: c.bg,
          borderLeft: `3px solid ${c.border}`,
          color: c.text,
        }}
      >
        <span className={`font-bold block truncate leading-tight ${compact ? "text-[9px]" : "text-[11px]"}`}>
          {hm(ev.start)} - {hm(ev.end)}
        </span>
        {p.height > 24 && (
          <span className={`font-medium block truncate opacity-90 leading-tight ${compact ? "text-[9px]" : "text-xs"}`}>
            {ev.patientName}
          </span>
        )}
        {!compact && p.height > 54 && (
          <span className="text-[10px] block truncate opacity-60 leading-tight mt-0.5">{ev.title}</span>
        )}
      </button>
    );
  }

  /* ── Now indicator ── */
  function NowLine() {
    const now = new Date();
    const nh = now.getHours() + now.getMinutes() / 60;
    if (nh < 7 || nh > 21) return null;
    return (
      <div
        className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
        style={{ top: (nh - 7) * HOUR_H + 10 }}
      >
        <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1 shadow-sm shadow-red-500/50" />
        <div className="flex-1 h-0.5 bg-red-500/50" />
      </div>
    );
  }

  /* ═══════════ DAY VIEW ═══════════ */
  function DayView() {
    const dayEv = eventsFor(date);
    return (
      <div className="space-y-4">
        {/* day strip */}
        <div className="flex flex-row gap-0.5">
          {weekDays.map((d) => (
            <button
              key={d.toISOString()}
              onClick={() => setDate(d)}
              className={`flex flex-1 flex-col items-center py-1 rounded-lg transition-all
                ${same(d, date)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : isToday(d)
                    ? "bg-primary/10 hover:bg-primary/20"
                    : "hover:bg-muted/50"
                }`}
            >
              <span className={`text-[9px] uppercase tracking-wider font-medium ${same(d, date) ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {d.toLocaleDateString("es-CL", { weekday: "narrow" })}
              </span>
              <span className="text-xs font-bold leading-tight">
                {d.getDate()}
              </span>
            </button>
          ))}
        </div>

        {/* time grid */}
        <div className="relative overflow-y-auto rounded-xl" style={{ maxHeight: "calc(100vh - 340px)" }}>
          <div className="relative" style={{ height: HOURS.length * HOUR_H + 20 }}>
            {/* hour lines and labels */}
            {HOURS.map((h) => {
              const y = (h - 7) * HOUR_H + 10;
              return (
                <div key={h}>
                  <div
                    className="absolute left-0 right-0 border-t border-border/20"
                    style={{ top: y }}
                  >
                    <span className="absolute left-0.5 text-[10px] text-muted-foreground/50 font-medium select-none tabular-nums" style={{ top: -10 }}>
                      {h.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                  <div
                    className="absolute left-10 right-0 border-t border-border/8"
                    style={{ top: y + HOUR_H / 2 }}
                  />
                </div>
              );
            })}
            {isToday(date) && <NowLine />}
            {/* events */}
            {dayEv.map((ev) => {
              const c = STATUS_STYLE[ev.status] ?? STATUS_STYLE.SCHEDULED;
              const s = new Date(ev.start);
              const e = new Date(ev.end);
              const sh = s.getHours() + s.getMinutes() / 60;
              const eh = e.getHours() + e.getMinutes() / 60;
              const top = (sh - 7) * HOUR_H + 10;
              const height = Math.max((eh - sh) * HOUR_H, 30);
              return (
                <button
                  key={ev.id}
                  onClick={() => router.push(`/appointments/${ev.id}`)}
                  className="absolute left-12 right-1 rounded-lg px-2 py-1 text-left cursor-pointer transition-all hover:brightness-125 hover:scale-[1.02] backdrop-blur-sm overflow-hidden z-10"
                  style={{
                    top,
                    height,
                    backgroundColor: c.bg,
                    borderLeft: `3px solid ${c.border}`,
                    color: c.text,
                  }}
                >
                  <span className="text-[11px] font-bold block truncate leading-tight">
                    {hm(ev.start)} - {hm(ev.end)}
                  </span>
                  {height > 24 && (
                    <span className="text-xs font-medium block truncate opacity-90 leading-tight">
                      {ev.patientName}
                    </span>
                  )}
                  {height > 54 && (
                    <span className="text-[10px] block truncate opacity-60 leading-tight mt-0.5">{ev.title}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════ WEEK VIEW ═══════════ */
  function WeekView() {
    const GRID_MIN_W = 620;
    return (
      <div className="overflow-x-auto overflow-y-auto rounded-xl" style={{ maxHeight: "calc(100vh - 290px)" }}>
        <div style={{ minWidth: GRID_MIN_W }}>
          {/* day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "2.5rem repeat(7, 1fr)" }} className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border/20 pb-1.5">
            <div />
            {weekDays.map((d) => (
              <button
                key={d.toISOString()}
                onClick={() => { setDate(d); setView("day"); }}
                className={`flex flex-col items-center py-1.5 rounded-xl transition-colors mx-0.5
                  ${isToday(d) ? "bg-primary/10" : "hover:bg-muted/40"}`}
              >
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                  {d.toLocaleDateString("es-CL", { weekday: "short" })}
                </span>
                <span className={`text-sm font-bold leading-tight ${isToday(d) ? "text-primary" : ""}`}>
                  {d.getDate()}
                </span>
              </button>
            ))}
          </div>

          {/* time grid */}
          <div
            className="relative"
            style={{ display: "grid", gridTemplateColumns: "2.5rem repeat(7, 1fr)", height: HOURS.length * HOUR_H }}
          >
            {/* hour labels */}
            {HOURS.map((h) => (
              <span
                key={h}
                className="col-start-1 absolute text-[10px] text-muted-foreground/40 w-9 text-right pr-1 select-none font-medium tabular-nums"
                style={{ top: (h - 7) * HOUR_H - 6 }}
              >
                {h.toString().padStart(2, "0")}:00
              </span>
            ))}

            {/* horizontal lines */}
            {HOURS.map((h) => (
              <div
                key={`line-${h}`}
                className="col-span-full absolute left-10 right-0 border-t border-border/12"
                style={{ top: (h - 7) * HOUR_H }}
              />
            ))}

            {/* day columns */}
            {weekDays.map((d, i) => {
              const de = eventsFor(d);
              return (
                <div
                  key={d.toISOString()}
                  className={`relative border-l border-border/10 ${isToday(d) ? "bg-primary/3" : ""}`}
                  style={{ gridColumn: i + 2 }}
                >
                  {isToday(d) && <NowLine />}
                  {de.map((ev) => (
                    <Ev key={ev.id} ev={ev} compact />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════ RENDER ═══════════ */
  return (
    <div className="space-y-3">
      {/* toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-xl border border-border/30 overflow-hidden">
            <button onClick={prev} className="px-2.5 py-1.5 text-sm hover:bg-muted/40 transition-colors">‹</button>
            <button onClick={next} className="px-2.5 py-1.5 text-sm hover:bg-muted/40 transition-colors">›</button>
          </div>
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-[11px] font-medium rounded-xl border border-border/30 hover:bg-muted/40 transition-colors"
          >
            Hoy
          </button>
        </div>

        <h2 className="text-sm sm:text-base font-semibold capitalize truncate">{title}</h2>

        <div className="flex rounded-xl border border-border/30 overflow-hidden text-[11px] font-medium shrink-0">
          <button
            onClick={() => setView("week")}
            className={`px-3 py-1.5 transition-colors ${view === "week" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/40"}`}
          >
            Semana
          </button>
          <button
            onClick={() => setView("day")}
            className={`px-3 py-1.5 transition-colors ${view === "day" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/40"}`}
          >
            Día
          </button>
        </div>
      </div>

      {view === "day" ? <DayView /> : <WeekView />}
    </div>
  );
}
