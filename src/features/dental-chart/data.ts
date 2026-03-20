import env from "@/config/env";
import type { Invoice, Payment, ProcedureLineItem } from "@/features/finances/types";
import type {
  DentalEntryType,
  DentalVisitSummary,
  MedicalFile,
  MedicalFileCategory,
  PatientChartRecord,
  ToothFormValues,
  ToothRecord,
} from "./types";

const FILES_STORAGE_KEY = "dental-chart-files-v1";

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
}

interface ApiDoctor {
  id: string | number;
  full_name: string;
}

interface ApiAppointment {
  id: string | number;
  patient_id: string | number;
  scheduled_at: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  notes?: string | null;
  doctor_name?: string | null;
  service_name?: string | null;
}

interface ApiTreatment {
  id: string | number;
  patient_id: string | number;
  doctor_id?: string | number | null;
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
  treatment_id?: string | number | null;
  amount: number;
  method?: "cash" | "card" | "bank_transfer" | string | null;
  notes?: string | null;
  paid_at: string;
  status?: "paid" | "pending" | "partial" | "overdue" | string | null;
}

interface LocalFilesMap {
  [patientId: string]: {
    [toothNumber: string]: MedicalFile[];
  };
}

export const UPPER_TEETH = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
export const LOWER_TEETH = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

export const fileCategoryLabels: Record<MedicalFileCategory, { uk: string; en: string }> = {
  xray: { uk: "Рентген", en: "X-ray" },
  scan: { uk: "Скан", en: "Scan" },
  photo: { uk: "Фото", en: "Photo" },
  document: { uk: "Документ", en: "Document" },
};

export const entryTypeLabels: Record<DentalEntryType, { uk: string; en: string }> = {
  diagnosis: { uk: "Діагностика", en: "Diagnosis" },
  treatment: { uk: "Лікування", en: "Treatment" },
  observation: { uk: "Спостереження", en: "Observation" },
};

function createEmptyToothRecord(toothNumber: number): ToothRecord {
  return {
    toothNumber,
    title: "",
    type: "diagnosis",
    diagnosis: "",
    treatment: "",
    notes: "",
    doctorName: "",
    visitDate: "",
    updatedAt: null,
    entries: [],
    files: [],
  };
}

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchApi<T>(path: string, params?: Record<string, string>) {
  const url = new URL(`${env.apiBaseUrl}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const response = await fetch(url.toString(), { headers: getAuthHeaders() });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || `Request failed for ${path}`);
  }

  return payload.data;
}

async function postApi<T>(path: string, body: unknown) {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || `Request failed for ${path}`);
  }

  return payload.data;
}

function loadLocalFiles(): LocalFilesMap {
  if (typeof window === "undefined") return {};

  const raw = window.localStorage.getItem(FILES_STORAGE_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as LocalFilesMap;
  } catch {
    return {};
  }
}

function persistLocalFiles(files: LocalFilesMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(files));
}

function normalizeDate(dateTime?: string | null) {
  return dateTime ? dateTime.slice(0, 10) : "";
}

function normalizeTime(dateTime?: string | null) {
  return dateTime ? dateTime.slice(11, 16) : "";
}

function normalizePatient(patient: ApiPatient) {
  return {
    id: String(patient.id),
    fullName: patient.full_name,
    phone: patient.phone || "",
    email: patient.email || "",
    notes: patient.notes || "",
    lastVisit: "",
    createdAt: "",
  };
}

function buildEntriesForPatient(
  patientId: string,
  treatments: ApiTreatment[],
  localFiles: LocalFilesMap,
): ToothRecord[] {
  const teeth = Array.from({ length: 32 }, (_, index) => createEmptyToothRecord(index + 1));
  const patientFiles = localFiles[patientId] || {};

  treatments
    .filter((treatment) => Number(treatment.tooth_number) >= 1 && Number(treatment.tooth_number) <= 32)
    .sort((a, b) => b.treated_at.localeCompare(a.treated_at))
    .forEach((treatment) => {
      const toothNumber = Number(treatment.tooth_number);
      const tooth = teeth[toothNumber - 1];
      const diagnosis = treatment.diagnosis || "";
      const notes = treatment.notes || "";
      const procedure = treatment.procedure || "";
      const doctorName = treatment.doctor_name || "";
      const visitDate = normalizeDate(treatment.treated_at);
      const type: DentalEntryType = diagnosis && !procedure ? "diagnosis" : "treatment";

      tooth.title = procedure;
      tooth.type = type;
      tooth.diagnosis = diagnosis;
      tooth.treatment = procedure;
      tooth.notes = notes;
      tooth.doctorName = doctorName;
      tooth.visitDate = visitDate;
      tooth.updatedAt = tooth.updatedAt && tooth.updatedAt > visitDate ? tooth.updatedAt : visitDate;
      tooth.entries.push({
        id: String(treatment.id),
        toothNumber,
        type,
        title: procedure || diagnosis || "Оновлення зуба",
        description: [diagnosis, procedure, notes].filter(Boolean).join(". "),
        doctorName,
        visitDate,
        createdAt: treatment.treated_at,
      });
    });

  teeth.forEach((tooth) => {
    tooth.files = patientFiles[String(tooth.toothNumber)] || [];
  });

  return teeth;
}

function buildVisits(appointments: ApiAppointment[]): DentalVisitSummary[] {
  return appointments
    .map((appointment) => ({
      id: String(appointment.id),
      date: normalizeDate(appointment.scheduled_at),
      time: normalizeTime(appointment.scheduled_at),
      doctorName: appointment.doctor_name || "",
      procedure: appointment.service_name || appointment.notes || "Візит",
      status:
        appointment.status === "confirmed"
          ? "scheduled"
          : appointment.status === "completed"
            ? "completed"
            : appointment.status === "cancelled"
              ? "cancelled"
              : "scheduled",
    }))
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
}

function buildInvoices(
  patientId: string,
  patientName: string,
  treatments: ApiTreatment[],
  payments: ApiPayment[],
): Invoice[] {
  return treatments
    .slice()
    .sort((a, b) => b.treated_at.localeCompare(a.treated_at))
    .map((treatment) => {
      const treatmentId = String(treatment.id);
      const relatedPayments = payments.filter(
        (payment) =>
          String(payment.patient_id) === patientId &&
          payment.treatment_id != null &&
          String(payment.treatment_id) === treatmentId,
      );

      const procedures: ProcedureLineItem[] = [
        {
          id: `proc-${treatmentId}`,
          name: treatment.procedure,
          toothNumber: treatment.tooth_number ? Number(treatment.tooth_number) : undefined,
          quantity: 1,
          unitPrice: Number(treatment.cost || 0),
        },
      ];

      const mappedPayments: Payment[] = relatedPayments.map((payment) => ({
        id: String(payment.id),
        invoiceId: treatmentId,
        amount: Number(payment.amount),
        date: normalizeDate(payment.paid_at),
        method:
          payment.method === "card" || payment.method === "bank_transfer" ? payment.method : "cash",
        note: payment.notes || undefined,
      }));

      const total = Number(treatment.cost || 0);
      const paid = mappedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const balance = total - paid;

      return {
        id: treatmentId,
        patientId,
        patientName,
        date: normalizeDate(treatment.treated_at),
        dueDate: normalizeDate(treatment.treated_at),
        status: balance <= 0 ? "paid" : paid > 0 ? "partial" : "pending",
        currency: "₴",
        procedures,
        payments: mappedPayments,
      };
    });
}

export async function loadPatientCharts(): Promise<PatientChartRecord[]> {
  const [patients, doctors, appointments, treatments, payments] = await Promise.all([
    fetchApi<ApiPatient[]>("/patients", { limit: "100" }),
    fetchApi<ApiDoctor[]>("/doctors", { active: "true" }),
    fetchApi<ApiAppointment[]>("/appointments", { limit: "200" }),
    fetchApi<ApiTreatment[]>("/treatments", { limit: "200" }),
    fetchApi<ApiPayment[]>("/payments", { limit: "200" }),
  ]);

  const localFiles = loadLocalFiles();

  return patients.map((patient) => {
    const patientId = String(patient.id);
    const patientAppointments = appointments.filter((appointment) => String(appointment.patient_id) === patientId);
    const patientTreatments = treatments.filter((treatment) => String(treatment.patient_id) === patientId);
    const patientPayments = payments.filter((payment) => String(payment.patient_id) === patientId);
    const teeth = buildEntriesForPatient(patientId, patientTreatments, localFiles);
    const visits = buildVisits(patientAppointments);
    const invoices = buildInvoices(patientId, patient.full_name, patientTreatments, patientPayments);
    const files = Object.values(localFiles[patientId] || {}).flat();
    const doctorNames = Array.from(
      new Set([
        ...doctors.map((doctor) => doctor.full_name),
        ...patientTreatments.map((treatment) => treatment.doctor_name).filter(Boolean),
        ...patientAppointments.map((appointment) => appointment.doctor_name).filter(Boolean),
      ]),
    ) as string[];
    const latestTreatment = patientTreatments
      .map((treatment) => normalizeDate(treatment.treated_at))
      .sort((a, b) => b.localeCompare(a))[0];

    return {
      patient: {
        ...normalizePatient(patient),
        lastVisit: latestTreatment || visits[0]?.date || "",
      },
      attendingDoctors: doctorNames,
      teeth,
      visits,
      invoices,
      files,
      updatedAt: latestTreatment || visits[0]?.date || "",
    };
  });
}

export function persistPatientCharts(_charts: PatientChartRecord[]) {
  return;
}

export async function saveToothRecord(
  patientId: string,
  values: ToothFormValues,
  toothNumber: number,
  doctorNameOptions: string[],
) {
  const doctors = await fetchApi<ApiDoctor[]>("/doctors", { active: "true" });
  const matchedDoctor =
    doctors.find((doctor) => doctor.full_name.trim().toLowerCase() === values.doctorName.trim().toLowerCase()) ||
    doctors.find((doctor) => doctor.full_name === doctorNameOptions[0]) ||
    doctors[0];

  if (!matchedDoctor) {
    throw new Error("No doctors available in API");
  }

  await postApi("/treatments", {
    patient_id: Number(patientId),
    doctor_id: Number(matchedDoctor.id),
    tooth_number: toothNumber,
    diagnosis: values.diagnosis.trim() || null,
    procedure: values.title.trim() || values.treatment.trim() || values.diagnosis.trim() || `Tooth #${toothNumber}`,
    notes: values.notes.trim() || null,
    cost: 0,
    treated_at: values.visitDate
      ? `${values.visitDate}T09:00:00.000Z`
      : new Date().toISOString(),
  });

  if (values.fileName.trim()) {
    const files = loadLocalFiles();
    const patientFiles = files[patientId] || {};
    const toothFiles = patientFiles[String(toothNumber)] || [];

    patientFiles[String(toothNumber)] = [
      {
        id: `file-${Date.now()}`,
        name: values.fileName.trim(),
        category: values.fileCategory,
        note: values.fileNote.trim(),
        toothNumber,
        addedAt: values.visitDate || new Date().toISOString().slice(0, 10),
      },
      ...toothFiles,
    ];

    files[patientId] = patientFiles;
    persistLocalFiles(files);
  }
}

export function formatDate(date: string, locale: "uk" | "en") {
  if (!date) return "—";

  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function getPatientBalance(invoices: Invoice[]) {
  return invoices.reduce((sum, invoice) => {
    const total = invoice.procedures.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const paid = invoice.payments.reduce((acc, payment) => acc + payment.amount, 0);
    return sum + (total - paid);
  }, 0);
}

export function getPatientPaid(invoices: Invoice[]) {
  return invoices.reduce(
    (sum, invoice) => sum + invoice.payments.reduce((acc, payment) => acc + payment.amount, 0),
    0,
  );
}

export function getPatientInvoiced(invoices: Invoice[]) {
  return invoices.reduce(
    (sum, invoice) => sum + invoice.procedures.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0),
    0,
  );
}

export function getChangedTeethCount(teeth: ToothRecord[]) {
  return teeth.filter((tooth) => hasToothChanges(tooth)).length;
}

export function hasToothChanges(tooth: ToothRecord) {
  return Boolean(
    tooth.title ||
      tooth.diagnosis ||
      tooth.treatment ||
      tooth.notes ||
      tooth.files.length ||
      tooth.entries.length,
  );
}
