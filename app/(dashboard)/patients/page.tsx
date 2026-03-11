"use client";

import { PatientForm } from "@/components/patients/PatientForm";
import { PatientList } from "@/components/patients/PatientList";
import { Input } from "@/components/ui/input";
import { usePatients } from "@/hooks/use-patients";
import { Search } from "lucide-react";

export default function PatientsPage() {
  const { patients, search, setSearch, total, loading, refetch } = usePatients();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">
            {total} paciente{total !== 1 ? "s" : ""} registrado
            {total !== 1 ? "s" : ""}
          </p>
        </div>
        <PatientForm onSuccess={refetch} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Cargando...
        </div>
      ) : (
        <PatientList patients={patients} />
      )}
    </div>
  );
}
