export interface Invoice {
  id: string;
  patientName: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid' | 'overdue';
  procedures: string;
}
