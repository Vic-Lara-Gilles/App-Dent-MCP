"use client";

import { PatientForm } from "@/components/patients/PatientForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatientDetail } from "@/hooks/use-patient-detail";
import { ArrowLeft, FileText, Mail, Phone, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { patient, loading, refetch, deletePatient } = usePatientDetail(id);

  if (loading || !patient) {
    return <div className="text-center py-12 text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/patients")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {patient.firstName} {patient.lastName}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> {patient.phone}
            </span>
            {patient.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> {patient.email}
              </span>
            )}
          </div>
        </div>
        <PatientForm patient={patient} onSuccess={refetch} />
        <Button variant="destructive" size="sm" onClick={deletePatient}>
          <Trash2 className="h-4 w-4 mr-1" /> Eliminar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Saldo Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${patient.totalDebt > 0 ? "text-red-600" : "text-green-600"}`}>
              ${patient.totalDebt.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Tratamientos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{patient.treatments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Citas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{patient.appointments.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {patient.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" /> Observaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{patient.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Treatments */}
      <Card>
        <CardHeader>
          <CardTitle>Tratamientos</CardTitle>
        </CardHeader>
        <CardContent>
          {patient.treatments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin tratamientos registrados.</p>
          ) : (
            <div className="space-y-4">
              {patient.treatments.map((t) => {
                const paid = t.payments.reduce((s, p) => s + Number(p.amount), 0);
                const total = Number(t.totalAmount);
                const remaining = Math.max(0, total - paid);
                const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

                return (
                  <div key={t.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{t.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Creado: {new Date(t.createdAt).toLocaleDateString("es-MX")}
                        </p>
                      </div>
                      <Badge
                        variant={
                          t.status === "COMPLETED"
                            ? "secondary"
                            : t.status === "CANCELLED"
                              ? "outline"
                              : "default"
                        }
                      >
                        {t.status === "IN_PROGRESS"
                          ? "En progreso"
                          : t.status === "COMPLETED"
                            ? "Completado"
                            : "Cancelado"}
                      </Badge>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Pagado: ${paid.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                        <span>Total: ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-right mt-1 text-muted-foreground">
                        Pendiente: ${remaining.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    {/* Payment history */}
                    {t.payments.length > 0 && (
                      <div className="text-xs space-y-1">
                        <p className="font-medium">Abonos:</p>
                        {t.payments.map((p) => (
                          <div key={p.id} className="flex justify-between text-muted-foreground">
                            <span>
                              {new Date(p.createdAt).toLocaleDateString("es-MX")} — {p.method}
                              {p.note ? ` (${p.note})` : ""}
                            </span>
                            <span className="font-medium text-foreground">
                              ${Number(p.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Citas</CardTitle>
        </CardHeader>
        <CardContent>
          {patient.appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin citas registradas.</p>
          ) : (
            <div className="space-y-2">
              {patient.appointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.date).toLocaleString("es-MX")} — {a.duration} min
                    </p>
                  </div>
                  <Badge variant={a.status === "COMPLETED" ? "secondary" : "default"}>
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
