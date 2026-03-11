"use client";

import { useCallback, useEffect, useState } from "react";

export interface DentistListItem {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  specialty: string | null;
  createdAt: string;
}

interface PaginatedResult {
  data: DentistListItem[];
  total: number;
  page: number;
  limit: number;
}

export function useDentists() {
  const [dentists, setDentists] = useState<DentistListItem[]>([]);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDentists = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);

    const res = await fetch(`/api/dentists?${params.toString()}`);
    const data: PaginatedResult = await res.json();

    setDentists(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(fetchDentists, 300);
    return () => clearTimeout(timeout);
  }, [fetchDentists]);

  return { dentists, search, setSearch, total, loading, refetch: fetchDentists };
}
