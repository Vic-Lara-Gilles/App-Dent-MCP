"use client";

import type { PaginatedResult, PatientListItem } from "@/lib/types/patient";
import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";

// ─── usePatients Hook ────────────────────────────────
// SRP: Encapsulates patient list fetching and search state

export function usePatients() {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/patients?${params.toString()}`);
      if (!res.ok) throw new Error("No se pudo cargar el listado");
      const data: PaginatedResult<PatientListItem> = await res.json();

      setPatients(data.data || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Error al cargar el listado");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(fetchPatients, 300);
    return () => clearTimeout(timeout);
  }, [fetchPatients]);

  return { patients, search, setSearch, total, loading, refetch: fetchPatients };
}
