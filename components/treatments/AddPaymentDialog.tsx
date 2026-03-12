"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface AddPaymentDialogProps {
  treatmentId: string;
  balance: number;
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  OTHER: "Otro",
};

export function AddPaymentDialog({ treatmentId, balance }: AddPaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    if (numAmount > balance) {
      toast.error(`El monto excede el saldo pendiente ($${balance.toLocaleString("es-CL", { minimumFractionDigits: 0 })})`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount, method, note: note || undefined, treatmentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al registrar el abono");
        return;
      }

      toast.success("Abono registrado correctamente");
      setOpen(false);
      setAmount("");
      setNote("");
      setMethod("CASH");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            disabled={balance <= 0}
            className="gap-1.5"
          />
        }
      >
        <PlusCircle className="h-3.5 w-3.5" />
        Abono
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar abono</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">
              Monto{" "}
              <span className="text-xs text-muted-foreground">
                (saldo: ${balance.toLocaleString("es-CL", { minimumFractionDigits: 0 })})
              </span>
            </Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              max={balance}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Método de pago</Label>
            <Select value={method} onValueChange={(v) => { if (v !== null) setMethod(v); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METHOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Nota (opcional)</Label>
            <Textarea
              id="note"
              placeholder="Ej. Mensualidad 3..."
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Guardando..." : "Registrar abono"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
