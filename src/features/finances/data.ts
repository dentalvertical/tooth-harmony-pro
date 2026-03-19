import type { Invoice } from './types';

export const mockInvoices: Invoice[] = [
  {
    id: '1',
    patientId: 'p1',
    patientName: 'Олена Коваленко',
    date: '2025-03-15',
    dueDate: '2025-03-30',
    status: 'paid',
    currency: '₴',
    procedures: [
      { id: 'li1', name: 'Пломбування', toothNumber: 16, quantity: 1, unitPrice: 1800 },
      { id: 'li2', name: 'Анестезія', quantity: 1, unitPrice: 700 },
    ],
    payments: [
      { id: 'pay1', invoiceId: '1', amount: 2500, date: '2025-03-15', method: 'card' },
    ],
  },
  {
    id: '2',
    patientId: 'p2',
    patientName: 'Андрій Шевченко',
    date: '2025-03-12',
    dueDate: '2025-03-27',
    status: 'pending',
    currency: '₴',
    procedures: [
      { id: 'li3', name: 'Професійна чистка', quantity: 1, unitPrice: 1800 },
    ],
    payments: [],
  },
  {
    id: '3',
    patientId: 'p3',
    patientName: 'Марія Петренко',
    date: '2025-03-10',
    dueDate: '2025-03-25',
    status: 'partial',
    currency: '₴',
    procedures: [
      { id: 'li4', name: 'Протезування (коронка)', toothNumber: 21, quantity: 1, unitPrice: 4200 },
      { id: 'li5', name: 'Тимчасова коронка', toothNumber: 21, quantity: 1, unitPrice: 1000 },
    ],
    payments: [
      { id: 'pay2', invoiceId: '3', amount: 3000, date: '2025-03-10', method: 'cash' },
    ],
  },
  {
    id: '4',
    patientId: 'p4',
    patientName: 'Ігор Бондаренко',
    date: '2025-03-08',
    dueDate: '2025-03-18',
    status: 'overdue',
    currency: '₴',
    procedures: [
      { id: 'li6', name: 'Видалення зуба', toothNumber: 36, quantity: 1, unitPrice: 1500 },
      { id: 'li7', name: 'Імплантат (титан)', toothNumber: 36, quantity: 1, unitPrice: 2000 },
    ],
    payments: [],
  },
  {
    id: '5',
    patientId: 'p5',
    patientName: 'Наталія Ткаченко',
    date: '2025-03-05',
    dueDate: '2025-03-20',
    status: 'paid',
    currency: '₴',
    procedures: [
      { id: 'li8', name: 'Профілактичний огляд', quantity: 1, unitPrice: 500 },
      { id: 'li9', name: 'Рентген (панорамний)', quantity: 1, unitPrice: 300 },
    ],
    payments: [
      { id: 'pay3', invoiceId: '5', amount: 800, date: '2025-03-05', method: 'card' },
    ],
  },
  {
    id: '6',
    patientId: 'p6',
    patientName: 'Василь Мельник',
    date: '2025-02-28',
    dueDate: '2025-03-15',
    status: 'paid',
    currency: '₴',
    procedures: [
      { id: 'li10', name: 'Лікування каналів', toothNumber: 24, quantity: 1, unitPrice: 3500 },
      { id: 'li11', name: 'Анестезія', quantity: 1, unitPrice: 700 },
    ],
    payments: [
      { id: 'pay4', invoiceId: '6', amount: 4200, date: '2025-02-28', method: 'bank_transfer' },
    ],
  },
  {
    id: '7',
    patientId: 'p7',
    patientName: 'Тетяна Кравченко',
    date: '2025-02-20',
    dueDate: '2025-03-07',
    status: 'partial',
    currency: '₴',
    procedures: [
      { id: 'li12', name: 'Пломбування (композит)', toothNumber: 14, quantity: 2, unitPrice: 1200 },
    ],
    payments: [
      { id: 'pay5', invoiceId: '7', amount: 1000, date: '2025-02-20', method: 'cash' },
    ],
  },
];
