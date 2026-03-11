"use client";

import { DentistSelect } from "@/components/dentists/DentistSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  patientId: string;
  /** Optional pre-filled date (e.g. from calendar click) */
  defaultDate?: string;
  onSuccess: () => void;
}

export function AppointmentForm({ patientId, defaultDate, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dentistId, setDentistId] = useState<string | undefined>();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || undefined,
        date: formData.get("date") as string,
        duration: Number(formData.get("duration")),
        patientId,
        dentistId,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Error al crear cita");
      return;
    }

    toast.success("Cita agendada");
    setOpen(false);
    setDentistId(undefined);
    (e.target as HTMLFormElement).reset();
    onSuccess();
  }

  // Default datetime: next whole hour
  const nextHour = () => {
    const d = defaultDate ? new Date(defaultDate) : new Date();
    if (!defaultDate) {
      d.setHours(d.getHours() + 1, 0, 0, 0);
    }
    return d.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <CalendarPlus className="h-4 w-4 mr-1" /> Nueva Cita
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Cita</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Ej: Limpieza, Control ortodoncia..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha y Hora *</Label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                defaultValue={nextHour()}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (min)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="5"
                step="5"
                defaultValue={30}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Notas (opcional)</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Dentista</Label>
            <DentistSelect value={dentistId} onValueChange={setDentistId} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Agendar Cita"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
