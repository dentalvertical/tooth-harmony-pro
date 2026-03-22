PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO users (id, email, password_hash, role, full_name, active, created_at, updated_at) VALUES
  (1, 'admin@clinic.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'administrator', 'Anna Sydorenko', 1, datetime('now', '-180 days'), datetime('now', '-1 day')),
  (2, 'ivanenko@clinic.com', 'f348d5628621f3d8f59c8cabda0f8eb0aa7e0514a90be7571020b1336f26c113', 'doctor', 'Oleksandr Ivanenko', 1, datetime('now', '-180 days'), datetime('now', '-1 day')),
  (3, 'koval@clinic.com', 'f348d5628621f3d8f59c8cabda0f8eb0aa7e0514a90be7571020b1336f26c113', 'doctor', 'Viktoriia Koval', 1, datetime('now', '-180 days'), datetime('now', '-1 day'));

INSERT OR IGNORE INTO doctors (id, user_id, full_name, specialization, phone, email, color, active, created_at, updated_at) VALUES
  (1, 2, 'Oleksandr Ivanenko', 'Therapist', '+380501111111', 'ivanenko@clinic.com', '#3B82F6', 1, datetime('now', '-180 days'), datetime('now', '-1 day')),
  (2, 3, 'Viktoriia Koval', 'Surgeon', '+380502222222', 'koval@clinic.com', '#10B981', 1, datetime('now', '-180 days'), datetime('now', '-1 day'));

INSERT OR IGNORE INTO services (id, name, description, price, duration_minutes, category, active, created_at, updated_at) VALUES
  (1, 'Check-up', 'Routine examination', 500, 30, 'consultation', 1, datetime('now', '-180 days'), datetime('now', '-1 day')),
  (2, 'Composite filling', 'Direct restoration', 1800, 40, 'therapy', 1, datetime('now', '-180 days'), datetime('now', '-1 day')),
  (3, 'Professional cleaning', 'Ultrasonic cleaning', 1800, 45, 'hygiene', 1, datetime('now', '-180 days'), datetime('now', '-1 day')),
  (4, 'Extraction', 'Tooth extraction', 1500, 60, 'surgery', 1, datetime('now', '-180 days'), datetime('now', '-1 day'));

INSERT OR IGNORE INTO patients (id, full_name, phone, email, notes, created_at, updated_at) VALUES
  (1, 'Olena Kovalenko', '+380501234567', 'olena@email.com', 'Lidocaine allergy', datetime('now', '-285 days'), datetime('now', '-6 days')),
  (2, 'Andrii Shevchenko', '+380672345678', 'andriy@email.com', '', datetime('now', '-212 days'), datetime('now', '-9 days')),
  (3, 'Mariia Petrenko', '+380933456789', 'maria@email.com', 'Type 2 diabetes', datetime('now', '-432 days'), datetime('now', '-11 days')),
  (4, 'Ihor Bondarenko', '+380504567890', 'igor@email.com', '', datetime('now', '-139 days'), datetime('now', '-13 days')),
  (5, 'Nataliia Tkachenko', '+380675678901', 'natalia@email.com', 'Pregnancy, month 3', datetime('now', '-185 days'), datetime('now', '-16 days'));

INSERT OR IGNORE INTO appointments (id, patient_id, doctor_id, service_id, scheduled_at, duration_minutes, status, notes, created_by, created_at, updated_at) VALUES
  (1, 1, 2, 1, datetime('now', '+1 day', '09:00'), 30, 'scheduled', 'Routine exam', 1, datetime('now', '-5 days'), datetime('now', '-5 days')),
  (2, 2, 2, 2, datetime('now', '+1 day', '10:00'), 40, 'scheduled', 'Needs filling', 1, datetime('now', '-5 days'), datetime('now', '-5 days')),
  (3, 3, 3, 3, datetime('now', '+1 day', '11:00'), 45, 'scheduled', 'Hygiene session', 1, datetime('now', '-5 days'), datetime('now', '-5 days')),
  (4, 4, 3, 4, datetime('now', '+2 day', '14:00'), 60, 'scheduled', 'Pre-extraction consult', 1, datetime('now', '-4 days'), datetime('now', '-4 days')),
  (5, 1, 3, 2, datetime('now', '-6 day', '10:00'), 40, 'completed', 'Post-op control', 1, datetime('now', '-10 days'), datetime('now', '-6 days'));

INSERT OR IGNORE INTO treatments (id, patient_id, doctor_id, appointment_id, tooth_number, diagnosis, procedure, notes, cost, treated_at, created_at, updated_at) VALUES
  (1, 1, 3, 5, 16, 'Caries', 'Composite filling', 'Composite restoration', 1800, datetime('now', '-6 day', '10:00'), datetime('now', '-6 day', '10:00'), datetime('now', '-6 day', '10:00')),
  (2, 2, 2, NULL, 26, 'Plaque build-up', 'Professional cleaning', 'Ultrasonic cleaning', 1800, datetime('now', '-9 day', '12:00'), datetime('now', '-9 day', '12:00'), datetime('now', '-9 day', '12:00')),
  (3, 4, 3, NULL, 36, 'Destroyed tooth', 'Extraction', 'Complex extraction', 1500, datetime('now', '-13 day', '15:00'), datetime('now', '-13 day', '15:00'), datetime('now', '-13 day', '15:00'));

INSERT OR IGNORE INTO payments (id, patient_id, treatment_id, amount, method, status, notes, paid_at, created_by, created_at, updated_at) VALUES
  (1, 1, 1, 1800, 'card', 'paid', 'Paid on the day of treatment', datetime('now', '-6 day', '10:30'), 1, datetime('now', '-6 day', '10:30'), datetime('now', '-6 day', '10:30')),
  (2, 2, 2, 1800, 'cash', 'paid', 'Paid at reception', datetime('now', '-9 day', '12:30'), 1, datetime('now', '-9 day', '12:30'), datetime('now', '-9 day', '12:30')),
  (3, 4, 3, 750, 'cash', 'partial', 'Partial prepayment', datetime('now', '-13 day', '15:30'), 1, datetime('now', '-13 day', '15:30'), datetime('now', '-13 day', '15:30'));

INSERT OR IGNORE INTO medical_files (id, patient_id, tooth_number, treatment_id, doctor_id, category, file_name, mime_type, size_bytes, note, content_base64, created_by, created_at, updated_at) VALUES
  (1, 1, 16, 1, 3, 'xray', 'tooth-16-xray.txt', 'text/plain', 18, 'Demo file', 'U2FtcGxlIFgtcmF5IGRhdGE=', 1, datetime('now', '-6 day', '10:10'), datetime('now', '-6 day', '10:10'));
