export interface Patient {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  notes: string;
  lastVisit: string;
  createdAt: string;
}

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

export interface Invoice {
  id: string;
  patientName: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid' | 'overdue';
  procedures: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'assistant';
  phone: string;
}

export type ToothStatus = 'healthy' | 'cavity' | 'filled' | 'missing' | 'implant';

export interface ToothData {
  id: number;
  status: ToothStatus;
  procedures: string[];
}

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

export const mockAppointments: Appointment[] = [
  { id: '1', patientId: '1', patientName: 'Олена Коваленко', doctorName: 'Др. Іваненко', date: '2025-03-18', time: '09:00', procedure: 'Огляд', status: 'scheduled' },
  { id: '2', patientId: '2', patientName: 'Андрій Шевченко', doctorName: 'Др. Іваненко', date: '2025-03-18', time: '10:00', procedure: 'Пломбування', status: 'scheduled' },
  { id: '3', patientId: '3', patientName: 'Марія Петренко', doctorName: 'Др. Коваль', date: '2025-03-18', time: '11:00', procedure: 'Чистка', status: 'scheduled' },
  { id: '4', patientId: '4', patientName: 'Ігор Бондаренко', doctorName: 'Др. Коваль', date: '2025-03-18', time: '14:00', procedure: 'Видалення', status: 'scheduled' },
  { id: '5', patientId: '5', patientName: 'Наталія Ткаченко', doctorName: 'Др. Іваненко', date: '2025-03-19', time: '09:30', procedure: 'Консультація', status: 'scheduled' },
  { id: '6', patientId: '1', patientName: 'Олена Коваленко', doctorName: 'Др. Коваль', date: '2025-03-15', time: '10:00', procedure: 'Пломбування', status: 'completed' },
];

export const mockInvoices: Invoice[] = [
  { id: '1', patientName: 'Олена Коваленко', amount: 2500, date: '2025-03-15', status: 'paid', procedures: 'Пломбування' },
  { id: '2', patientName: 'Андрій Шевченко', amount: 1800, date: '2025-03-12', status: 'pending', procedures: 'Чистка' },
  { id: '3', patientName: 'Марія Петренко', amount: 5200, date: '2025-03-10', status: 'paid', procedures: 'Протезування' },
  { id: '4', patientName: 'Ігор Бондаренко', amount: 3500, date: '2025-03-08', status: 'overdue', procedures: 'Видалення + Імплантат' },
  { id: '5', patientName: 'Наталія Ткаченко', amount: 800, date: '2025-03-05', status: 'paid', procedures: 'Огляд' },
  { id: '6', patientName: 'Василь Мельник', amount: 4200, date: '2025-02-28', status: 'paid', procedures: 'Лікування каналів' },
  { id: '7', patientName: 'Тетяна Кравченко', amount: 1500, date: '2025-02-20', status: 'pending', procedures: 'Пломбування' },
];

export const mockStaff: StaffMember[] = [
  { id: '1', name: 'Олександр Іваненко', email: 'ivanenko@clinic.com', role: 'doctor', phone: '+380501111111' },
  { id: '2', name: 'Вікторія Коваль', email: 'koval@clinic.com', role: 'doctor', phone: '+380502222222' },
  { id: '3', name: 'Анна Сидоренко', email: 'sydorenko@clinic.com', role: 'assistant', phone: '+380503333333' },
  { id: '4', name: 'Адмін Системний', email: 'admin@clinic.com', role: 'admin', phone: '+380504444444' },
];

export const mockRevenueData = [
  { month: 'Січ', revenue: 45000 },
  { month: 'Лют', revenue: 52000 },
  { month: 'Бер', revenue: 48000 },
  { month: 'Кві', revenue: 61000 },
  { month: 'Тра', revenue: 55000 },
  { month: 'Чер', revenue: 67000 },
];

export const generateDentalChart = (): ToothData[] => {
  const teeth: ToothData[] = [];
  const statuses: ToothStatus[] = ['healthy', 'cavity', 'filled', 'missing', 'implant'];
  
  for (let i = 1; i <= 32; i++) {
    const rand = Math.random();
    let status: ToothStatus = 'healthy';
    if (rand > 0.7) status = statuses[Math.floor(Math.random() * 5)];
    
    teeth.push({
      id: i,
      status,
      procedures: status !== 'healthy' ? ['Огляд 15.01.2025'] : [],
    });
  }
  return teeth;
};
