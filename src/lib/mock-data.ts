// Re-export from feature modules for backward compatibility
export { mockPatients } from '@/features/patients/data';
export type { Patient } from '@/features/patients/types';

export { mockAppointments } from '@/features/appointments/data';
export type { Appointment } from '@/features/appointments/types';

export { mockInvoices } from '@/features/finances/data';
export type { Invoice } from '@/features/finances/types';

export { mockStaff } from '@/features/settings/data';
export type { StaffMember } from '@/features/settings/types';

export { mockRevenueData } from '@/features/dashboard/data';

export { generateDentalChart } from '@/features/dental-chart/data';
export type { ToothData, ToothStatus } from '@/features/dental-chart/types';
