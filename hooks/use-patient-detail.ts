"use client";

import type { PatientDetail } from "@/lib/types/patient";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// ─── usePatientDetail Hook ───────────────────────────
// SRP: Encapsulates single patient fetching and deletion

export function usePatientDetail(id: string) {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/patients/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          if (!cancelled) {
            toast.error("Paciente no encontrado");
            router.push("/patients");
          }
          return;
        }
        const data: PatientDetail = await res.json();
        if (!cancelled) {
          setPatient(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Error al cargar paciente");
      });

    return () => {
      cancelled = true;
    };
  }, [id, router, revision]);

  const refetch = useCallback(() => setRevision((r) => r + 1), []);

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

  return { patient, loading, refetch, deletePatient };
}

