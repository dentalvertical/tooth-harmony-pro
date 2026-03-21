import env from "@/config/env";
import type { Appointment } from "@/features/appointments/types";
import type { Invoice, Payment as InvoicePayment, ProcedureLineItem } from "@/features/finances/types";
import type { Patient } from "@/features/patients/types";
import type { StaffMember } from "@/features/settings/types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
  error?: string;
}

interface ApiPatient {
  id: string | number;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  created_at?: string | null;
}

interface ApiDoctor {
  id: string | number;
  full_name: string;
  specialization?: string | null;
  email?: string | null;
  phone?: string | null;
  active?: number | boolean | null;
}

interface ApiUser {
  id: string | number;
  email: string;
  role: "superuser" | "administrator" | "doctor";
  full_name: string;
  active?: number | boolean;
}

interface ApiAppointment {
  id: string | number;
  patient_id: string | number;
  patient_name?: string | null;
  doctor_name?: string | null;
  scheduled_at: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  notes?: string | null;
  service_name?: string | null;
}

interface ApiTreatment {
  id: string | number;
  patient_id: string | number;
  patient_name?: string | null;
  doctor_name?: string | null;
  tooth_number?: number | null;
  diagnosis?: string | null;
  procedure: string;
  notes?: string | null;
  cost?: number | null;
  treated_at: string;
}

interface ApiPayment {
  id: string | number;
  patient_id: string | number;
  patient_name?: string | null;
  treatment_id?: string | number | null;
  amount: number;
  method?: "cash" | "card" | "bank_transfer" | string | null;
  notes?: string | null;
  paid_at: string;
  status?: "paid" | "pending" | "partial" | "overdue" | string | null;
}

interface DashboardStatsResponse {
  totals: {
    patients: number;
    doctors: number;
    services: number;
  };
  appointments: {
    today: number;
    upcoming: number;
    completed: number;
  };
  revenue: {
    today: number;
    last_30_days: number;
  };
  recent_appointments: Array<{
    scheduled_at: string;
    status: string;
    patient_name: string;
    patient_phone?: string | null;
    doctor_name?: string | null;
    service_name?: string | null;
  }>;
  top_services: Array<{
    name: string;
    bookings: number;
  }>;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("auth_token");
}

async function request<T>(method: string, path: string, body?: unknown, params?: Record<string, string>) {
  const url = new URL(`${env.apiBaseUrl}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== "") url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || `API request failed: ${path}`);
  }

  return payload.data;
}

function toDate(dateTime?: string | null) {
  return dateTime ? dateTime.slice(0, 10) : "";
}

function toTime(dateTime?: string | null) {
  return dateTime ? dateTime.slice(11, 16) : "";
}

export function mapAppointment(appointment: ApiAppointment): Appointment {
  return {
    id: String(appointment.id),
    patientId: String(appointment.patient_id),
    patientName: appointment.patient_name || "",
    doctorName: appointment.doctor_name || "",
    date: toDate(appointment.scheduled_at),
    time: toTime(appointment.scheduled_at),
    procedure: appointment.service_name || appointment.notes || "Visit",
    status: appointment.status === "confirmed" ? "scheduled" : appointment.status,
  };
}

export async function getPatients(search = ""): Promise<Patient[]> {
  const data = await request<ApiPatient[]>("GET", "/patients", undefined, { limit: "200", q: search });
  const appointments = await getAppointments();
  const lastVisitByPatient = new Map<string, string>();

  appointments.forEach((appointment) => {
    const current = lastVisitByPatient.get(appointment.patientId);
    if (!current || appointment.date > current) {
      lastVisitByPatient.set(appointment.patientId, appointment.date);
    }
  });

  return data.map((patient) => ({
    id: String(patient.id),
    fullName: patient.full_name,
    phone: patient.phone || "",
    email: patient.email || "",
    notes: patient.notes || "",
    lastVisit: lastVisitByPatient.get(String(patient.id)) || "",
    createdAt: toDate(patient.created_at),
  }));
}

export async function createPatient(input: Pick<Patient, "fullName" | "phone" | "email" | "notes">) {
  const patient = await request<ApiPatient>("POST", "/patients", {
    full_name: input.fullName,
    phone: input.phone || null,
    email: input.email || null,
    notes: input.notes || null,
  });

  return {
    id: String(patient.id),
    fullName: patient.full_name,
    phone: patient.phone || "",
    email: patient.email || "",
    notes: patient.notes || "",
    lastVisit: "",
    createdAt: toDate(patient.created_at),
  } satisfies Patient;
}

export async function deletePatient(patientId: string) {
  await request("DELETE", `/patients/${patientId}`);
}

export async function getAppointments(params?: Record<string, string>): Promise<Appointment[]> {
  const data = await request<ApiAppointment[]>("GET", "/appointments", undefined, { limit: "500", ...params });
  return data.map(mapAppointment);
}

interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  notes?: string;
  durationMinutes?: number;
}

export async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  const scheduledAt = `${input.date}T${input.time}:00.000Z`;
  const data = await request<ApiAppointment>("POST", "/appointments", {
    patient_id: Number(input.patientId),
    doctor_id: Number(input.doctorId),
    scheduled_at: scheduledAt,
    duration_minutes: input.durationMinutes || 30,
    notes: input.notes || null,
  });

  return mapAppointment(data);
}

export async function getDoctors() {
  const data = await request<ApiDoctor[]>("GET", "/doctors", undefined, { active: "true" });
  return data.map((doctor) => ({
    id: String(doctor.id),
    name: doctor.full_name,
    email: doctor.email || "",
    phone: doctor.phone || "",
    specialty: doctor.specialization || "",
  }));
}

export async function getTreatments() {
  const data = await request<ApiTreatment[]>("GET", "/treatments", undefined, { limit: "500" });
  return data;
}

export async function getPayments() {
  const data = await request<ApiPayment[]>("GET", "/payments", undefined, { limit: "500" });
  return data;
}

export async function getUsers(): Promise<StaffMember[]> {
  const data = await request<ApiUser[]>("GET", "/users");
  return data
    .filter((user) => user.active !== false && user.active !== 0)
    .map((user) => ({
      id: String(user.id),
      name: user.full_name,
      email: user.email,
      role: user.role,
      phone: "",
    }));
}

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: StaffMember["role"];
}

export async function createUser(input: CreateUserInput): Promise<StaffMember> {
  const data = await request<ApiUser>("POST", "/users", {
    full_name: input.name,
    email: input.email,
    password: input.password,
    role: input.role,
  });

  return {
    id: String(data.id),
    name: data.full_name,
    email: data.email,
    role: data.role,
    phone: "",
  };
}

interface UpdateUserInput {
  id: string;
  name?: string;
  password?: string;
  role?: StaffMember["role"];
  active?: boolean;
}

export async function updateUser(input: UpdateUserInput): Promise<StaffMember> {
  const data = await request<ApiUser>("PUT", `/users/${input.id}`, {
    full_name: input.name,
    password: input.password,
    role: input.role,
    active: input.active,
  });

  return {
    id: String(data.id),
    name: data.full_name,
    email: data.email,
    role: data.role,
    phone: "",
  };
}

export async function deactivateUser(userId: string) {
  await request("DELETE", `/users/${userId}`);
}

export async function getDashboardStats() {
  return request<DashboardStatsResponse>("GET", "/dashboard/stats");
}

export async function getFinanceInvoices(): Promise<Invoice[]> {
  const [patients, treatments, payments] = await Promise.all([getPatients(), getTreatments(), getPayments()]);
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));

  return treatments
    .slice()
    .sort((a, b) => b.treated_at.localeCompare(a.treated_at))
    .map((treatment) => {
      const invoiceId = String(treatment.id);
      const patientId = String(treatment.patient_id);
      const invoicePayments = payments.filter(
        (payment) =>
          String(payment.patient_id) === patientId &&
          payment.treatment_id != null &&
          String(payment.treatment_id) === invoiceId,
      );

      const procedures: ProcedureLineItem[] = [
        {
          id: `li-${invoiceId}`,
          name: treatment.procedure,
          toothNumber: treatment.tooth_number ? Number(treatment.tooth_number) : undefined,
          quantity: 1,
          unitPrice: Number(treatment.cost || 0),
        },
      ];

      const mappedPayments: InvoicePayment[] = invoicePayments.map((payment) => ({
        id: String(payment.id),
        invoiceId,
        amount: Number(payment.amount),
        date: toDate(payment.paid_at),
        method:
          payment.method === "card" || payment.method === "bank_transfer" ? payment.method : "cash",
        note: payment.notes || undefined,
      }));

      const total = procedures.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const paid = mappedPayments.reduce((sum, item) => sum + item.amount, 0);
      const balance = total - paid;

      return {
        id: invoiceId,
        patientId,
        patientName: patientMap.get(patientId)?.fullName || treatment.patient_name || "",
        date: toDate(treatment.treated_at),
        dueDate: toDate(treatment.treated_at),
        status: balance <= 0 ? "paid" : paid > 0 ? "partial" : "pending",
        currency: "₴",
        procedures,
        payments: mappedPayments,
      } satisfies Invoice;
    });
}
