PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS __backup_users;
DROP TABLE IF EXISTS __backup_patients;
DROP TABLE IF EXISTS __backup_doctors;
DROP TABLE IF EXISTS __backup_services;
DROP TABLE IF EXISTS __backup_appointments;
DROP TABLE IF EXISTS __backup_treatments;
DROP TABLE IF EXISTS __backup_payments;
DROP TABLE IF EXISTS __backup_files;

CREATE TABLE __backup_users AS
SELECT
  id,
  lower(trim(email)) AS email,
  password_hash,
  role,
  full_name,
  created_at,
  updated_at
FROM users;

CREATE TABLE __backup_patients AS
SELECT
  id,
  full_name,
  phone,
  email,
  date_of_birth,
  gender,
  address,
  notes,
  created_by,
  created_at,
  updated_at
FROM patients;

CREATE TABLE __backup_doctors AS
SELECT
  id,
  user_id,
  full_name,
  specialization,
  phone,
  email,
  active,
  created_at
FROM doctors;

CREATE TABLE __backup_services AS
SELECT
  id,
  name,
  description,
  price,
  duration_minutes,
  category,
  active,
  created_at
FROM services;

CREATE TABLE __backup_appointments AS
SELECT
  id,
  patient_id,
  doctor_id,
  service_id,
  scheduled_at,
  duration_minutes,
  status,
  notes,
  created_by,
  created_at,
  updated_at
FROM appointments;

CREATE TABLE __backup_treatments AS
SELECT
  id,
  patient_id,
  doctor_id,
  appointment_id,
  tooth_number,
  diagnosis,
  procedure,
  notes,
  cost,
  treated_at,
  created_at
FROM treatments;

CREATE TABLE __backup_payments AS
SELECT
  id,
  patient_id,
  treatment_id,
  amount,
  method,
  status,
  notes,
  paid_at,
  created_by,
  created_at
FROM payments;

CREATE TABLE __backup_files AS
SELECT
  id,
  patient_id,
  tooth_number,
  treatment_id,
  doctor_id,
  category,
  file_name,
  mime_type,
  size_bytes,
  note,
  content_base64,
  created_at,
  updated_at
FROM files;

DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS treatments;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superuser', 'administrator', 'doctor')),
  full_name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  date_of_birth TEXT,
  gender TEXT,
  address TEXT,
  notes TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE doctors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  full_name TEXT NOT NULL,
  specialization TEXT,
  phone TEXT,
  email TEXT,
  color TEXT DEFAULT '#3B82F6',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  category TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  doctor_id INTEGER NOT NULL,
  service_id INTEGER,
  scheduled_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE treatments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  doctor_id INTEGER NOT NULL,
  appointment_id INTEGER,
  tooth_number INTEGER,
  diagnosis TEXT,
  procedure TEXT NOT NULL,
  notes TEXT,
  cost REAL NOT NULL DEFAULT 0,
  treated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  treatment_id INTEGER,
  amount REAL NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'card', 'bank_transfer')),
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'partial', 'overdue')),
  notes TEXT,
  paid_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (treatment_id) REFERENCES treatments(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE medical_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  tooth_number INTEGER,
  treatment_id INTEGER,
  doctor_id INTEGER,
  category TEXT NOT NULL DEFAULT 'document' CHECK (category IN ('xray', 'scan', 'photo', 'document')),
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  content_base64 TEXT NOT NULL,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (treatment_id) REFERENCES treatments(id) ON DELETE SET NULL,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO users (id, email, password_hash, role, full_name, active, created_at, updated_at)
SELECT
  id,
  email,
  password_hash,
  CASE
    WHEN email = '0991597753r@gmail.com' THEN 'superuser'
    WHEN role = 'doctor' THEN 'doctor'
    ELSE 'administrator'
  END,
  full_name,
  1,
  COALESCE(created_at, datetime('now')),
  COALESCE(updated_at, created_at, datetime('now'))
FROM __backup_users;

INSERT INTO patients (id, full_name, phone, email, date_of_birth, gender, address, notes, created_by, created_at, updated_at)
SELECT
  id,
  full_name,
  phone,
  email,
  date_of_birth,
  gender,
  address,
  notes,
  created_by,
  COALESCE(created_at, datetime('now')),
  COALESCE(updated_at, created_at, datetime('now'))
FROM __backup_patients;

INSERT INTO doctors (id, user_id, full_name, specialization, phone, email, color, active, created_at, updated_at)
SELECT
  d.id,
  d.user_id,
  d.full_name,
  d.specialization,
  d.phone,
  d.email,
  CASE
    WHEN u.role = 'superuser' THEN '#DC2626'
    WHEN u.role = 'doctor' THEN '#3B82F6'
    ELSE '#10B981'
  END,
  COALESCE(d.active, 1),
  COALESCE(d.created_at, datetime('now')),
  COALESCE(d.created_at, datetime('now'))
FROM __backup_doctors d
LEFT JOIN users u ON u.id = d.user_id;

INSERT INTO doctors (user_id, full_name, specialization, phone, email, color, active, created_at, updated_at)
SELECT
  u.id,
  u.full_name,
  CASE WHEN u.role = 'superuser' THEN 'Administrator' ELSE 'Dentist' END,
  NULL,
  u.email,
  CASE WHEN u.role = 'superuser' THEN '#DC2626' ELSE '#3B82F6' END,
  u.active,
  u.created_at,
  u.updated_at
FROM users u
LEFT JOIN doctors d ON d.user_id = u.id
WHERE u.role IN ('doctor', 'superuser')
  AND d.id IS NULL;

INSERT INTO services (id, name, description, price, duration_minutes, category, active, created_at, updated_at)
SELECT
  id,
  name,
  description,
  price,
  duration_minutes,
  category,
  COALESCE(active, 1),
  COALESCE(created_at, datetime('now')),
  COALESCE(created_at, datetime('now'))
FROM __backup_services;

INSERT INTO appointments (id, patient_id, doctor_id, service_id, scheduled_at, duration_minutes, status, notes, created_by, created_at, updated_at)
SELECT
  id,
  patient_id,
  doctor_id,
  service_id,
  scheduled_at,
  COALESCE(duration_minutes, 30),
  CASE
    WHEN status IN ('scheduled', 'confirmed', 'completed', 'cancelled') THEN status
    ELSE 'scheduled'
  END,
  notes,
  created_by,
  COALESCE(created_at, datetime('now')),
  COALESCE(updated_at, created_at, datetime('now'))
FROM __backup_appointments;

INSERT INTO treatments (id, patient_id, doctor_id, appointment_id, tooth_number, diagnosis, procedure, notes, cost, treated_at, created_at, updated_at)
SELECT
  id,
  patient_id,
  doctor_id,
  appointment_id,
  CASE
    WHEN trim(COALESCE(tooth_number, '')) = '' THEN NULL
    ELSE CAST(tooth_number AS INTEGER)
  END,
  diagnosis,
  procedure,
  notes,
  COALESCE(cost, 0),
  COALESCE(treated_at, datetime('now')),
  COALESCE(created_at, datetime('now')),
  COALESCE(created_at, datetime('now'))
FROM __backup_treatments;

INSERT INTO payments (id, patient_id, treatment_id, amount, method, status, notes, paid_at, created_by, created_at, updated_at)
SELECT
  id,
  patient_id,
  treatment_id,
  COALESCE(amount, 0),
  CASE
    WHEN method = 'transfer' THEN 'bank_transfer'
    WHEN method IN ('cash', 'card', 'bank_transfer') THEN method
    ELSE 'cash'
  END,
  CASE
    WHEN status = 'refunded' THEN 'pending'
    WHEN status IN ('paid', 'pending', 'partial', 'overdue') THEN status
    ELSE 'paid'
  END,
  notes,
  COALESCE(paid_at, datetime('now')),
  created_by,
  COALESCE(created_at, datetime('now')),
  COALESCE(created_at, datetime('now'))
FROM __backup_payments;

INSERT INTO medical_files (id, patient_id, tooth_number, treatment_id, doctor_id, category, file_name, mime_type, size_bytes, note, content_base64, created_by, created_at, updated_at)
SELECT
  id,
  patient_id,
  tooth_number,
  treatment_id,
  CASE
    WHEN EXISTS (SELECT 1 FROM doctors d WHERE d.id = __backup_files.doctor_id) THEN __backup_files.doctor_id
    ELSE NULL
  END,
  CASE
    WHEN category IN ('xray', 'scan', 'photo', 'document') THEN category
    ELSE 'document'
  END,
  file_name,
  mime_type,
  COALESCE(size_bytes, 0),
  note,
  content_base64,
  NULL,
  COALESCE(created_at, datetime('now')),
  COALESCE(updated_at, created_at, datetime('now'))
FROM __backup_files;

CREATE INDEX idx_users_role_active ON users(role, active);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_treatments_patient_id ON treatments(patient_id);
CREATE INDEX idx_treatments_doctor_id ON treatments(doctor_id);
CREATE INDEX idx_payments_patient_id ON payments(patient_id);
CREATE INDEX idx_medical_files_patient_id ON medical_files(patient_id);
CREATE INDEX idx_medical_files_tooth_number ON medical_files(tooth_number);

DROP TABLE __backup_users;
DROP TABLE __backup_patients;
DROP TABLE __backup_doctors;
DROP TABLE __backup_services;
DROP TABLE __backup_appointments;
DROP TABLE __backup_treatments;
DROP TABLE __backup_payments;
DROP TABLE __backup_files;

PRAGMA foreign_keys = ON;
