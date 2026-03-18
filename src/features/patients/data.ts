import type { Patient } from './types';

export const mockPatients: Patient[] = [
  { id: '1', fullName: 'Олена Коваленко', phone: '+380501234567', email: 'olena@email.com', notes: 'Алергія на лідокаїн', lastVisit: '2025-03-15', createdAt: '2024-06-10' },
  { id: '2', fullName: 'Андрій Шевченко', phone: '+380672345678', email: 'andriy@email.com', notes: '', lastVisit: '2025-03-12', createdAt: '2024-08-22' },
  { id: '3', fullName: 'Марія Петренко', phone: '+380933456789', email: 'maria@email.com', notes: 'Діабет 2 типу', lastVisit: '2025-03-10', createdAt: '2024-01-15' },
  { id: '4', fullName: 'Ігор Бондаренко', phone: '+380504567890', email: 'igor@email.com', notes: '', lastVisit: '2025-03-08', createdAt: '2024-11-03' },
  { id: '5', fullName: 'Наталія Ткаченко', phone: '+380675678901', email: 'natalia@email.com', notes: 'Вагітність 3 місяці', lastVisit: '2025-03-05', createdAt: '2024-09-18' },
  { id: '6', fullName: 'Василь Мельник', phone: '+380936789012', email: 'vasyl@email.com', notes: '', lastVisit: '2025-02-28', createdAt: '2024-04-07' },
  { id: '7', fullName: 'Тетяна Кравченко', phone: '+380507890123', email: 'tetiana@email.com', notes: 'Боязнь стоматолога', lastVisit: '2025-02-20', createdAt: '2024-07-25' },
  { id: '8', fullName: 'Дмитро Савченко', phone: '+380678901234', email: 'dmytro@email.com', notes: '', lastVisit: '2025-02-15', createdAt: '2025-01-10' },
];
