import type { Appointment } from './types';

export const mockAppointments: Appointment[] = [
  { id: '1', patientId: '1', patientName: 'Олена Коваленко', doctorName: 'Др. Іваненко', date: '2025-03-18', time: '09:00', procedure: 'Огляд', status: 'scheduled' },
  { id: '2', patientId: '2', patientName: 'Андрій Шевченко', doctorName: 'Др. Іваненко', date: '2025-03-18', time: '10:00', procedure: 'Пломбування', status: 'scheduled' },
  { id: '3', patientId: '3', patientName: 'Марія Петренко', doctorName: 'Др. Коваль', date: '2025-03-18', time: '11:00', procedure: 'Чистка', status: 'scheduled' },
  { id: '4', patientId: '4', patientName: 'Ігор Бондаренко', doctorName: 'Др. Коваль', date: '2025-03-18', time: '14:00', procedure: 'Видалення', status: 'scheduled' },
  { id: '5', patientId: '5', patientName: 'Наталія Ткаченко', doctorName: 'Др. Іваненко', date: '2025-03-19', time: '09:30', procedure: 'Консультація', status: 'scheduled' },
  { id: '6', patientId: '1', patientName: 'Олена Коваленко', doctorName: 'Др. Коваль', date: '2025-03-15', time: '10:00', procedure: 'Пломбування', status: 'completed' },
];
