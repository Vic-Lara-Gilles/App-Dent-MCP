"use client";

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

interface Dentist {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  specialty?: string | null;
}

export function DentistForm({
  dentist,
  onSuccess,
}: {
  dentist?: Dentist;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEdit = !!dentist;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
      email: (formData.get("email") as string) || undefined,
      specialty: (formData.get("specialty") as string) || undefined,
    };

    const url = isEdit ? `/api/dentists/${dentist.id}` : "/api/dentists";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Error al guardar");
      return;
    }

    toast.success(isEdit ? "Dentista actualizado" : "Dentista registrado");
    setOpen(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEdit ? (
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          Editar
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Dentista
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Dentista" : "Nuevo Dentista"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre *</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                defaultValue={dentist?.firstName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido *</Label>
              <Input
                id="lastName"
                name="lastName"
                required
                defaultValue={dentist?.lastName}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={dentist?.phone}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={dentist?.email || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialty">Especialidad</Label>
            <Input
              id="specialty"
              name="specialty"
              placeholder="Ej: Ortodoncia, Endodoncia, General..."
              defaultValue={dentist?.specialty || ""}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
