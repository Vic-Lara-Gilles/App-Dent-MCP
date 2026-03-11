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
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  patientId: string;
  onSuccess: () => void;
}

export function TreatmentForm({ patientId, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dentistId, setDentistId] = useState<string | undefined>();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/treatments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: formData.get("description") as string,
        totalAmount: Number(formData.get("totalAmount")),
        patientId,
        dentistId,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Error al crear tratamiento");
      return;
    }

    toast.success("Tratamiento creado");
    setOpen(false);
    setDentistId(undefined);
    (e.target as HTMLFormElement).reset();
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="h-4 w-4 mr-1" /> Nuevo Tratamiento
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Tratamiento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Input
              id="description"
              name="description"
              placeholder="Ej: Ortodoncia, Corona dental, Limpieza..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalAmount">Monto Total ($) *</Label>
            <Input
              id="totalAmount"
              name="totalAmount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Dentista</Label>
            <DentistSelect value={dentistId} onValueChange={setDentistId} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Crear Tratamiento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
