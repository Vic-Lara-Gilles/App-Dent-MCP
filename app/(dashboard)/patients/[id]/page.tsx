"use client";

import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { AppointmentStatusButton } from "@/components/appointments/AppointmentStatusButton";
import { PatientForm } from "@/components/patients/PatientForm";
import { PaymentForm } from "@/components/treatments/PaymentForm";
import { TreatmentForm } from "@/components/treatments/TreatmentForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.push("/patients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">
              {patient.firstName} {patient.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {patient.phone}
              </span>
              {patient.email && (
                <span className="flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3" /> {patient.email}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-11 sm:pl-0 sm:ml-auto sm:shrink-0">
          <PatientForm patient={patient} onSuccess={refetch} />
          <Button variant="destructive" size="sm" onClick={deletePatient}>
            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Saldo Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${patient.totalDebt > 0 ? "text-red-600" : "text-green-600"}`}>
              ${patient.totalDebt.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tratamientos</CardTitle>
          <TreatmentForm patientId={id} onSuccess={refetch} />
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
                          Creado: {new Date(t.createdAt).toLocaleDateString("es-CL")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.status === "IN_PROGRESS" && remaining > 0 && (
                          <PaymentForm
                            treatmentId={t.id}
                            balance={remaining}
                            onSuccess={refetch}
                          />
                        )}
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
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Pagado: ${paid.toLocaleString("es-CL", { minimumFractionDigits: 0 })}</span>
                        <span>Total: ${total.toLocaleString("es-CL", { minimumFractionDigits: 0 })}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-right mt-1 text-muted-foreground">
                        Pendiente: ${remaining.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
                      </p>
                    </div>

                    {/* Payment history */}
                    {t.payments.length > 0 && (
                      <div className="text-xs space-y-1">
                        <p className="font-medium">Abonos:</p>
                        {t.payments.map((p) => (
                          <div key={p.id} className="flex justify-between text-muted-foreground">
                            <span>
                              {new Date(p.createdAt).toLocaleDateString("es-CL")} — {p.method}
                              {p.note ? ` (${p.note})` : ""}
                            </span>
                            <span className="font-medium text-foreground">
                              ${Number(p.amount).toLocaleString("es-CL", { minimumFractionDigits: 0 })}
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Citas</CardTitle>
          <AppointmentForm patientId={id} onSuccess={refetch} />
        </CardHeader>
        <CardContent>
          {patient.appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin citas registradas.</p>
          ) : (
            <div className="space-y-2">
              {patient.appointments.map((a) => {
                const reminderMsg = `Hola ${patient.firstName}, le recordamos su cita "${a.title}" el ${new Date(a.date).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })} a las ${new Date(a.date).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}. Duración aprox. ${a.duration} min. \u00a1Le esperamos!`;
                return (
                  <div key={a.id} className="flex items-center justify-between border rounded-lg p-3 gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.date).toLocaleString("es-CL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} — {a.duration} min
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {["SCHEDULED", "CONFIRMED"].includes(a.status) && (
                        <WhatsAppButton phone={patient.phone} message={reminderMsg} label="Recordatorio" />
                      )}
                      <Badge variant={a.status === "COMPLETED" ? "secondary" : a.status === "CANCELLED" ? "destructive" : "outline"} className="hidden sm:inline-flex">
                        {a.status === "SCHEDULED" ? "Programada" : a.status === "CONFIRMED" ? "Confirmada" : a.status === "CANCELLED" ? "Cancelada" : a.status === "COMPLETED" ? "Completada" : "No asistió"}
                      </Badge>
                      <AppointmentStatusButton appointmentId={a.id} current={a.status} onSuccess={refetch} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
