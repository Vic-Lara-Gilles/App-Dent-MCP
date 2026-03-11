"use client";

import type { PatientDetail } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// ─── usePatientDetail Hook ───────────────────────────
// SRP: Encapsulates single patient fetching and deletion

export function usePatientDetail(id: string) {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPatient = useCallback(async () => {
    const res = await fetch(`/api/patients/${id}`);
    if (!res.ok) {
      toast.error("Paciente no encontrado");
      router.push("/patients");
      return;
    }
    setPatient(await res.json());
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  const deletePatient = useCallback(async () => {
    if (!confirm("¿Eliminar este paciente y todos sus datos?")) return;
    const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Paciente eliminado");
      router.push("/patients");
    } else {
      toast.error("Error al eliminar");
    }
  }, [id, router]);

  return { patient, loading, refetch: fetchPatient, deletePatient };
}
