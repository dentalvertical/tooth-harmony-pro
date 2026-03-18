import type { Invoice } from './types';

export const mockInvoices: Invoice[] = [
  { id: '1', patientName: 'Олена Коваленко', amount: 2500, date: '2025-03-15', status: 'paid', procedures: 'Пломбування' },
  { id: '2', patientName: 'Андрій Шевченко', amount: 1800, date: '2025-03-12', status: 'pending', procedures: 'Чистка' },
  { id: '3', patientName: 'Марія Петренко', amount: 5200, date: '2025-03-10', status: 'paid', procedures: 'Протезування' },
  { id: '4', patientName: 'Ігор Бондаренко', amount: 3500, date: '2025-03-08', status: 'overdue', procedures: 'Видалення + Імплантат' },
  { id: '5', patientName: 'Наталія Ткаченко', amount: 800, date: '2025-03-05', status: 'paid', procedures: 'Огляд' },
  { id: '6', patientName: 'Василь Мельник', amount: 4200, date: '2025-02-28', status: 'paid', procedures: 'Лікування каналів' },
  { id: '7', patientName: 'Тетяна Кравченко', amount: 1500, date: '2025-02-20', status: 'pending', procedures: 'Пломбування' },
];
