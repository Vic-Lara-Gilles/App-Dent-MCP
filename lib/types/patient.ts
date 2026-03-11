// ─── Patient Types ───────────────────────────────────
// Single source of truth for Patient-related types (ISP)

export interface PatientBase {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientListItem extends PatientBase {
  totalDebt: number;
}

export interface PaymentDetail {
  id: string;
  amount: string;
  method: string;
  note: string | null;
  createdAt: string;
}

export interface TreatmentDetail {
  id: string;
  description: string;
  totalAmount: string;
  status: string;
  payments: PaymentDetail[];
  createdAt: string;
}

export interface AppointmentDetail {
  id: string;
  title: string;
  description: string | null;
  date: string;
  duration: number;
  status: string;
}

export interface PatientDetail extends PatientBase {
  totalDebt: number;
  treatments: TreatmentDetail[];
  appointments: AppointmentDetail[];
}

export interface CreatePatientData {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface UpdatePatientData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PatientSearchParams {
  search?: string;
  page?: number;
  limit?: number;
}
