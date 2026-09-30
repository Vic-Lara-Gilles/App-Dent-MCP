"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Dentist { id: string; firstName: string; lastName: string }
export function PatientDentists(props: { patientId: string; linkedIds: string[]; onSuccess: () => void }) {
  return <AssignmentForm key={props.linkedIds.slice().sort().join(",")} {...props} />;
}
function AssignmentForm({ patientId, linkedIds, onSuccess }: { patientId: string; linkedIds: string[]; onSuccess: () => void }) {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selected, setSelected] = useState(linkedIds);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all: Dentist[] = [];
      for (let page = 1; ; page++) {
        const response = await fetch(`/api/dentists?limit=50&page=${page}`);
        if (!response.ok) throw new Error("Error al cargar dentistas");
        const result: { data: Dentist[]; total: number } = await response.json();
        all.push(...result.data);
        if (all.length >= result.total || !result.data.length) break;
      }
      if (!cancelled) { setDentists(all); setReady(true); }
    })().catch(() => { if (!cancelled) toast.error("Error al cargar dentistas"); });
    return () => { cancelled = true; };
  }, []);
  async function save() {
    setSaving(true);
    try {
      const response = await fetch(`/api/patients/${patientId}/dentists`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dentistIds: selected }),
      });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error || "Error al guardar vínculos"); }
      toast.success("Dentistas vinculados actualizados"); onSuccess();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Error al guardar vínculos"); }
    finally { setSaving(false); }
  }
  return <Card>
    <CardHeader><CardTitle>Dentistas vinculados</CardTitle></CardHeader>
    <CardContent className="space-y-3">
      {!ready && <p className="text-sm text-muted-foreground">Cargando dentistas…</p>}
      {dentists.map(dentist => <label key={dentist.id} className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={selected.includes(dentist.id)} disabled={saving} onChange={event => setSelected(previous => event.target.checked ? [...previous, dentist.id] : previous.filter(id => id !== dentist.id))} />
        {dentist.firstName} {dentist.lastName}
      </label>)}
      <p className="text-xs text-muted-foreground">Las citas y tratamientos registrados conservan el vínculo con su dentista.</p>
      <Button size="sm" onClick={save} disabled={!ready || saving}>{saving ? "Guardando…" : "Guardar vínculos"}</Button>
    </CardContent>
  </Card>;
}
