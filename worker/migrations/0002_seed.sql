PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO users (id, email, password_hash, role, full_name, specialization, phone, active, created_at, updated_at) VALUES
  (1, 'ivanenko@clinic.com', 'f348d5628621f3d8f59c8cabda0f8eb0aa7e0514a90be7571020b1336f26c113', 'doctor', 'Олександр Іваненко', 'Терапевт', '+380501111111', 1, datetime('now', '-180 days'), datetime('now', '-1 day')),
  (2, 'koval@clinic.com', 'f348d5628621f3d8f59c8cabda0f8eb0aa7e0514a90be7571020b1336f26c113', 'doctor', 'Вікторія Коваль', 'Хірург', '+380502222222', 1, datetime('now', '-180 days'), datetime('now', '-1 day')),
  (3, 'admin@clinic.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'administrator', 'Анна Сидоренко', NULL, '+380503333333', 1, datetime('now', '-180 days'), datetime('now', '-1 day')),
  (4, 'superuser@clinic.local', 'f75778f7425be4db0369d09af37a6c2b9a83dea0e53e7bd57412e4b060e607f7', 'superuser', 'Системний суперюзер', NULL, '+380504444444', 1, datetime('now', '-180 days'), datetime('now', '-1 day'));

INSERT OR IGNORE INTO patients (id, full_name, phone, email, notes, created_at, updated_at) VALUES
  (1, 'Олена Коваленко', '+380501234567', 'olena@email.com', 'Алергія на лідокаїн', datetime('now', '-285 days'), datetime('now', '-6 days')),
  (2, 'Андрій Шевченко', '+380672345678', 'andriy@email.com', '', datetime('now', '-212 days'), datetime('now', '-9 days')),
  (3, 'Марія Петренко', '+380933456789', 'maria@email.com', 'Діабет 2 типу', datetime('now', '-432 days'), datetime('now', '-11 days')),
  (4, 'Ігор Бондаренко', '+380504567890', 'igor@email.com', '', datetime('now', '-139 days'), datetime('now', '-13 days')),
  (5, 'Наталія Ткаченко', '+380675678901', 'natalia@email.com', 'Вагітність 3 місяці', datetime('now', '-185 days'), datetime('now', '-16 days')),
  (6, 'Василь Мельник', '+380936789012', 'vasyl@email.com', '', datetime('now', '-316 days'), datetime('now', '-22 days')),
  (7, 'Тетяна Кравченко', '+380507890123', 'tetiana@email.com', 'Боязнь стоматолога', datetime('now', '-207 days'), datetime('now', '-30 days')),
  (8, 'Дмитро Савченко', '+380678901234', 'dmytro@email.com', '', datetime('now', '-70 days'), datetime('now', '-34 days'));

INSERT OR IGNORE INTO appointments (id, patient_id, doctor_id, scheduled_at, duration_minutes, status, notes, service_name, created_at, updated_at) VALUES
  (1, 1, 1, datetime('now', '+1 day', '09:00'), 30, 'scheduled', 'Плановий огляд', 'Огляд', datetime('now', '-5 days'), datetime('now', '-5 days')),
  (2, 2, 1, datetime('now', '+1 day', '10:00'), 30, 'scheduled', 'Потрібне пломбування', 'Пломбування', datetime('now', '-5 days'), datetime('now', '-5 days')),
  (3, 3, 2, datetime('now', '+1 day', '11:00'), 45, 'scheduled', 'Професійна чистка', 'Чистка', datetime('now', '-5 days'), datetime('now', '-5 days')),
  (4, 4, 2, datetime('now', '+2 day', '14:00'), 60, 'scheduled', 'Консультація перед видаленням', 'Видалення', datetime('now', '-4 days'), datetime('now', '-4 days')),
  (5, 5, 1, datetime('now', '+3 day', '09:30'), 30, 'confirmed', 'Консультація', 'Консультація', datetime('now', '-4 days'), datetime('now', '-4 days')),
  (6, 1, 2, datetime('now', '-6 day', '10:00'), 40, 'completed', 'Контроль після лікування', 'Пломбування', datetime('now', '-10 days'), datetime('now', '-6 days')),
  (7, 6, 1, datetime('now', '-20 day', '12:00'), 50, 'completed', 'Лікування каналів', 'Лікування каналів', datetime('now', '-24 days'), datetime('now', '-20 days')),
  (8, 7, 1, datetime('now', '-28 day', '15:00'), 30, 'cancelled', 'Пацієнт скасував', 'Пломбування', datetime('now', '-31 days'), datetime('now', '-28 days'));

INSERT OR IGNORE INTO treatments (id, patient_id, doctor_id, tooth_number, diagnosis, procedure, notes, cost, treated_at, created_at, updated_at) VALUES
  (1, 1, 2, 16, 'Карієс', 'Пломбування', 'Композитна реставрація', 1800, datetime('now', '-6 day', '10:00'), datetime('now', '-6 day', '10:00'), datetime('now', '-6 day', '10:00')),
  (2, 2, 1, 26, 'Наліт', 'Професійна чистка', 'Ультразвукова чистка', 1800, datetime('now', '-9 day', '12:00'), datetime('now', '-9 day', '12:00'), datetime('now', '-9 day', '12:00')),
  (3, 3, 2, 21, 'Пошкодження коронки', 'Протезування (коронка)', 'Підготовка до встановлення коронки', 4200, datetime('now', '-11 day', '09:30'), datetime('now', '-11 day', '09:30'), datetime('now', '-11 day', '09:30')),
  (4, 4, 2, 36, 'Зруйнований зуб', 'Видалення зуба', 'Складне видалення', 1500, datetime('now', '-13 day', '15:00'), datetime('now', '-13 day', '15:00'), datetime('now', '-13 day', '15:00')),
  (5, 5, 1, NULL, 'Профілактика', 'Профілактичний огляд', 'Рутинний огляд', 500, datetime('now', '-16 day', '11:00'), datetime('now', '-16 day', '11:00'), datetime('now', '-16 day', '11:00')),
  (6, 6, 1, 24, 'Пульпіт', 'Лікування каналів', 'Ендодонтичне лікування', 3500, datetime('now', '-22 day', '12:00'), datetime('now', '-22 day', '12:00'), datetime('now', '-22 day', '12:00')),
  (7, 7, 1, 14, 'Карієс', 'Пломбування (композит)', 'Два контактні пункти', 2400, datetime('now', '-30 day', '16:30'), datetime('now', '-30 day', '16:30'), datetime('now', '-30 day', '16:30')),
  (8, 1, 2, 16, 'Контроль', 'Огляд після пломбування', 'Без ускладнень', 0, datetime('now', '-2 day', '10:30'), datetime('now', '-2 day', '10:30'), datetime('now', '-2 day', '10:30'));

INSERT OR IGNORE INTO payments (id, patient_id, treatment_id, amount, method, notes, paid_at, status, created_at, updated_at) VALUES
  (1, 1, 1, 1800, 'card', 'Оплачено в день лікування', datetime('now', '-6 day', '10:30'), 'paid', datetime('now', '-6 day', '10:30'), datetime('now', '-6 day', '10:30')),
  (2, 3, 3, 3000, 'cash', 'Передплата за коронку', datetime('now', '-11 day', '10:00'), 'partial', datetime('now', '-11 day', '10:00'), datetime('now', '-11 day', '10:00')),
  (3, 5, 5, 500, 'card', 'Оплачено на ресепшені', datetime('now', '-16 day', '11:30'), 'paid', datetime('now', '-16 day', '11:30'), datetime('now', '-16 day', '11:30')),
  (4, 6, 6, 3500, 'bank_transfer', 'Безготівковий платіж', datetime('now', '-22 day', '13:00'), 'paid', datetime('now', '-22 day', '13:00'), datetime('now', '-22 day', '13:00')),
  (5, 7, 7, 1000, 'cash', 'Часткова оплата', datetime('now', '-30 day', '17:00'), 'partial', datetime('now', '-30 day', '17:00'), datetime('now', '-30 day', '17:00'));

INSERT OR IGNORE INTO files (id, patient_id, tooth_number, treatment_id, doctor_id, category, file_name, mime_type, size_bytes, note, content_base64, created_at, updated_at) VALUES
  (1, 1, 16, 1, 2, 'xray', 'tooth-16-xray.txt', 'text/plain', 18, 'Демонстраційний файл', 'U2FtcGxlIFgtcmF5IGRhdGE=', datetime('now', '-6 day', '10:10'), datetime('now', '-6 day', '10:10')),
  (2, 3, 21, 3, 2, 'document', 'crown-plan.txt', 'text/plain', 25, 'План лікування', 'Q3Jvd24gdHJlYXRtZW50IHBsYW4=', datetime('now', '-11 day', '09:45'), datetime('now', '-11 day', '09:45'));
