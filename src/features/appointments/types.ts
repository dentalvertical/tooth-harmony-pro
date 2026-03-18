export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  procedure: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}
