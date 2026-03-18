import { create } from 'zustand';

export type Lang = 'uk' | 'en';

interface I18nStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const translations: Record<Lang, Record<string, string>> = {
  uk: {
    // Navigation
    'nav.dashboard': 'Дашборд',
    'nav.patients': 'Пацієнти',
    'nav.calendar': 'Календар',
    'nav.finances': 'Фінанси',
    'nav.settings': 'Налаштування',
    'nav.logout': 'Вийти',
    'nav.dentalChart': 'Зубна карта',

    // Login
    'login.title': 'Вхід до системи',
    'login.subtitle': 'Стоматологічна CRM',
    'login.email': 'Електронна пошта',
    'login.password': 'Пароль',
    'login.submit': 'Увійти',
    'login.forgot': 'Забули пароль?',

    // Dashboard
    'dashboard.title': 'Дашборд',
    'dashboard.revenue': 'Дохід за місяць',
    'dashboard.patients': 'Всього пацієнтів',
    'dashboard.appointments': 'Прийоми сьогодні',
    'dashboard.doctors': 'Активні лікарі',
    'dashboard.recentPatients': 'Останні пацієнти',
    'dashboard.upcomingAppointments': 'Найближчі прийоми',
    'dashboard.revenueChart': 'Дохід за місяцями',

    // Patients
    'patients.title': 'Пацієнти',
    'patients.add': 'Додати пацієнта',
    'patients.search': 'Пошук пацієнтів...',
    'patients.name': "Повне ім'я",
    'patients.phone': 'Телефон',
    'patients.email': 'Email',
    'patients.lastVisit': 'Останній візит',
    'patients.actions': 'Дії',
    'patients.edit': 'Редагувати',
    'patients.delete': 'Видалити',
    'patients.profile': 'Профіль пацієнта',
    'patients.history': 'Історія візитів',
    'patients.notes': 'Нотатки',
    'patients.files': 'Файли',

    // Dental Chart
    'dental.title': 'Стоматологічна карта',
    'dental.healthy': 'Здоровий',
    'dental.cavity': 'Карієс',
    'dental.filled': 'Пломбований',
    'dental.missing': 'Відсутній',
    'dental.implant': 'Імплантат',
    'dental.selectTooth': 'Оберіть зуб',
    'dental.status': 'Стан',
    'dental.procedures': 'Процедури',
    'dental.upper': 'Верхня щелепа',
    'dental.lower': 'Нижня щелепа',

    // Calendar
    'calendar.title': 'Календар прийомів',
    'calendar.addAppointment': 'Новий прийом',
    'calendar.day': 'День',
    'calendar.week': 'Тиждень',
    'calendar.patient': 'Пацієнт',
    'calendar.doctor': 'Лікар',
    'calendar.time': 'Час',
    'calendar.procedure': 'Процедура',

    // Finances
    'finances.title': 'Фінанси',
    'finances.invoices': 'Рахунки',
    'finances.createInvoice': 'Створити рахунок',
    'finances.pending': 'Очікує оплати',
    'finances.paid': 'Оплачено',
    'finances.overdue': 'Прострочено',
    'finances.amount': 'Сума',
    'finances.date': 'Дата',
    'finances.status': 'Статус',
    'finances.totalRevenue': 'Загальний дохід',
    'finances.outstanding': 'Заборгованість',

    // Settings
    'settings.title': 'Налаштування',
    'settings.clinic': 'Клініка',
    'settings.staff': 'Персонал',
    'settings.clinicName': 'Назва клініки',
    'settings.address': 'Адреса',
    'settings.phone': 'Телефон',
    'settings.addStaff': 'Додати працівника',
    'settings.role': 'Роль',
    'settings.admin': 'Адміністратор',
    'settings.doctor': 'Лікар',
    'settings.assistant': 'Асистент',
    'settings.language': 'Мова',
    'settings.save': 'Зберегти',

    // Common
    'common.save': 'Зберегти',
    'common.cancel': 'Скасувати',
    'common.delete': 'Видалити',
    'common.edit': 'Редагувати',
    'common.add': 'Додати',
    'common.search': 'Пошук',
    'common.noData': 'Даних немає',
    'common.loading': 'Завантаження...',
    'common.confirm': 'Підтвердити',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.patients': 'Patients',
    'nav.calendar': 'Calendar',
    'nav.finances': 'Finances',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.dentalChart': 'Dental Chart',

    'login.title': 'Sign In',
    'login.subtitle': 'Dental CRM',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.submit': 'Sign In',
    'login.forgot': 'Forgot password?',

    'dashboard.title': 'Dashboard',
    'dashboard.revenue': 'Monthly Revenue',
    'dashboard.patients': 'Total Patients',
    'dashboard.appointments': 'Today\'s Appointments',
    'dashboard.doctors': 'Active Doctors',
    'dashboard.recentPatients': 'Recent Patients',
    'dashboard.upcomingAppointments': 'Upcoming Appointments',
    'dashboard.revenueChart': 'Revenue by Month',

    'patients.title': 'Patients',
    'patients.add': 'Add Patient',
    'patients.search': 'Search patients...',
    'patients.name': 'Full Name',
    'patients.phone': 'Phone',
    'patients.email': 'Email',
    'patients.lastVisit': 'Last Visit',
    'patients.actions': 'Actions',
    'patients.edit': 'Edit',
    'patients.delete': 'Delete',
    'patients.profile': 'Patient Profile',
    'patients.history': 'Visit History',
    'patients.notes': 'Notes',
    'patients.files': 'Files',

    'dental.title': 'Dental Chart',
    'dental.healthy': 'Healthy',
    'dental.cavity': 'Cavity',
    'dental.filled': 'Filled',
    'dental.missing': 'Missing',
    'dental.implant': 'Implant',
    'dental.selectTooth': 'Select a tooth',
    'dental.status': 'Status',
    'dental.procedures': 'Procedures',
    'dental.upper': 'Upper Jaw',
    'dental.lower': 'Lower Jaw',

    'calendar.title': 'Appointments Calendar',
    'calendar.addAppointment': 'New Appointment',
    'calendar.day': 'Day',
    'calendar.week': 'Week',
    'calendar.patient': 'Patient',
    'calendar.doctor': 'Doctor',
    'calendar.time': 'Time',
    'calendar.procedure': 'Procedure',

    'finances.title': 'Finances',
    'finances.invoices': 'Invoices',
    'finances.createInvoice': 'Create Invoice',
    'finances.pending': 'Pending',
    'finances.paid': 'Paid',
    'finances.overdue': 'Overdue',
    'finances.amount': 'Amount',
    'finances.date': 'Date',
    'finances.status': 'Status',
    'finances.totalRevenue': 'Total Revenue',
    'finances.outstanding': 'Outstanding',

    'settings.title': 'Settings',
    'settings.clinic': 'Clinic',
    'settings.staff': 'Staff',
    'settings.clinicName': 'Clinic Name',
    'settings.address': 'Address',
    'settings.phone': 'Phone',
    'settings.addStaff': 'Add Staff',
    'settings.role': 'Role',
    'settings.admin': 'Admin',
    'settings.doctor': 'Doctor',
    'settings.assistant': 'Assistant',
    'settings.language': 'Language',
    'settings.save': 'Save',

    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.noData': 'No data',
    'common.loading': 'Loading...',
    'common.confirm': 'Confirm',
  },
};

export const useI18n = create<I18nStore>((set, get) => ({
  lang: 'uk',
  setLang: (lang) => set({ lang }),
  t: (key: string) => {
    const { lang } = get();
    return translations[lang][key] || key;
  },
}));
