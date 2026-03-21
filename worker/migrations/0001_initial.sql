PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superuser', 'administrator', 'doctor')),
  full_name TEXT NOT NULL,
  specialization TEXT,
  phone TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  doctor_id INTEGER,
  scheduled_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  service_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS treatments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  doctor_id INTEGER,
  tooth_number INTEGER,
  diagnosis TEXT,
  procedure TEXT NOT NULL,
  notes TEXT,
  cost REAL NOT NULL DEFAULT 0,
  treated_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  treatment_id INTEGER,
  amount REAL NOT NULL,
  method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'card', 'bank_transfer')),
  notes TEXT,
  paid_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'partial', 'overdue')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (treatment_id) REFERENCES treatments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  tooth_number INTEGER,
  treatment_id INTEGER,
  doctor_id INTEGER,
  category TEXT NOT NULL CHECK (category IN ('xray', 'scan', 'photo', 'document')),
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  note TEXT,
  content_base64 TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (treatment_id) REFERENCES treatments(id) ON DELETE SET NULL,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, active);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(full_name);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON appointments(patient_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_treatments_patient_date ON treatments(patient_id, treated_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_patient_date ON payments(patient_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_patient_date ON files(patient_id, created_at DESC);
