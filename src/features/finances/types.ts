export type InvoiceStatus = 'pending' | 'paid' | 'partial' | 'overdue';

export interface ProcedureLineItem {
  id: string;
  name: string;
  toothNumber?: number;
  quantity: number;
  unitPrice: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: 'cash' | 'card' | 'bank_transfer';
  note?: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  currency: string;
  procedures: ProcedureLineItem[];
  payments: Payment[];
}

// Computed helpers
export const getInvoiceTotal = (inv: Invoice): number =>
  inv.procedures.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);

export const getInvoicePaid = (inv: Invoice): number =>
  inv.payments.reduce((sum, p) => sum + p.amount, 0);

export const getInvoiceBalance = (inv: Invoice): number =>
  getInvoiceTotal(inv) - getInvoicePaid(inv);

export interface MonthlyReport {
  month: string;
  revenue: number;
  invoiced: number;
  outstanding: number;
  count: number;
}
