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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const METHODS: { value: string; label: string }[] = [
  { value: "CASH", label: "Efectivo" },
  { value: "TRANSFER", label: "Transferencia" },
  { value: "CARD", label: "Tarjeta" },
  { value: "OTHER", label: "Otro" },
];

interface Props {
  treatmentId: string;
  /** Saldo pendiente — límite máximo del abono */
  balance: number;
  onSuccess: () => void;
}

export function PaymentForm({ treatmentId, balance, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<string>("CASH");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));

    if (amount > balance) {
      toast.error(
        `El monto excede el saldo pendiente ($${balance.toLocaleString("es-CL", { minimumFractionDigits: 0 })})`
      );
      setLoading(false);
      return;
    }

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        method,
        note: (formData.get("note") as string) || undefined,
        treatmentId,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Error al registrar abono");
      return;
    }

    toast.success("Abono registrado");
    setOpen(false);
    (e.target as HTMLFormElement).reset();
    setMethod("CASH");
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <DollarSign className="h-3 w-3 mr-1" /> Abonar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Abono</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Saldo pendiente:{" "}
          <span className="font-semibold text-foreground">
            ${balance.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
          </span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto del Abono ($) *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              max={balance}
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Método de Pago</Label>
            <Select value={method} onValueChange={(v) => { if (v) setMethod(v); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Nota (opcional)</Label>
            <Textarea
              id="note"
              name="note"
              placeholder="Ej: Abono de marzo..."
              rows={2}
            />
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
              {loading ? "Guardando..." : "Registrar Abono"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
