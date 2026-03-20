import type { Invoice } from "@/features/finances/types";
import type { Patient } from "@/features/patients/types";

export type DentalEntryType = "diagnosis" | "treatment" | "observation";
export type MedicalFileCategory = "xray" | "scan" | "photo" | "document";

export interface MedicalFile {
  id: string;
  name: string;
  category: MedicalFileCategory;
  note: string;
  toothNumber?: number;
  addedAt: string;
}

export interface ToothEntry {
  id: string;
  toothNumber: number;
  type: DentalEntryType;
  title: string;
  description: string;
  doctorName: string;
  visitDate: string;
  createdAt: string;
}

export interface ToothRecord {
  toothNumber: number;
  title: string;
  type: DentalEntryType;
  diagnosis: string;
  treatment: string;
  notes: string;
  doctorName: string;
  visitDate: string;
  updatedAt: string | null;
  entries: ToothEntry[];
  files: MedicalFile[];
}

export interface DentalVisitSummary {
  id: string;
  date: string;
  time: string;
  doctorName: string;
  procedure: string;
  status: "scheduled" | "completed" | "cancelled";
}

export interface PatientChartRecord {
  patient: Patient;
  attendingDoctors: string[];
  teeth: ToothRecord[];
  visits: DentalVisitSummary[];
  invoices: Invoice[];
  files: MedicalFile[];
  updatedAt: string;
}

export interface PatientOption {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  lastVisit: string;
  notes: string;
}

export interface ToothFormValues {
  title: string;
  type: DentalEntryType;
  diagnosis: string;
  treatment: string;
  notes: string;
  doctorName: string;
  visitDate: string;
  fileName: string;
  fileCategory: MedicalFileCategory;
  fileNote: string;
}
