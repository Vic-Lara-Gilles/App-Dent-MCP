"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";

interface DentistOption {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string | null;
}

export function DentistSelect({
  value,
  onValueChange,
}: {
  value?: string;
  onValueChange: (value: string | undefined) => void;
}) {
  const [dentists, setDentists] = useState<DentistOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/dentists?limit=50")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setDentists(data.data || []);
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <Select
      value={value ?? ""}
      onValueChange={(val: string | null) => {
        onValueChange(val === "__none__" || !val ? undefined : val);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Sin asignar" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Sin asignar</SelectItem>
        {dentists.map((d) => (
          <SelectItem key={d.id} value={d.id}>
            Dr. {d.firstName} {d.lastName}
            {d.specialty ? ` — ${d.specialty}` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
