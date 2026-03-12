export const APPOINTMENT_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  NO_SHOW: "No asistio",
};

export const APPOINTMENT_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SCHEDULED: "outline",
  CONFIRMED: "default",
  CANCELLED: "destructive",
  COMPLETED: "secondary",
  NO_SHOW: "destructive",
};

export const TREATMENT_STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  OTHER: "Otro",
};
