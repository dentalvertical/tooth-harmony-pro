/**
 * DentaCRM – Cloudflare Worker API
 * Project: dentalvertical/tooth-harmony-pro
 *
 * Stack: React 18 + Vite + TypeScript (frontend) → Worker + D1 (backend)
 * Auth:  JWT HS256 via Web Crypto API (zero dependencies)
 *
 * ┌─────────────────────────────────────────────────────┐
 * │  ROUTES                                             │
 * ├─────────────────────────────────────────────────────┤
 * │  POST   /api/auth/login          (public)           │
 * │  POST   /api/auth/logout         (public)           │
 * │  GET    /api/auth/me             (auth)             │
 * │  PUT    /api/auth/password       (auth)             │
 * │                                                     │
 * │  GET    /api/patients            (staff+)           │
 * │  POST   /api/patients            (staff+)           │
 * │  GET    /api/patients/:id        (staff+)           │
 * │  PUT    /api/patients/:id        (staff+)           │
 * │  DELETE /api/patients/:id        (admin)            │
 * │                                                     │
 * │  GET    /api/doctors             (staff+)           │
 * │  POST   /api/doctors             (admin)            │
 * │  PUT    /api/doctors/:id         (admin)            │
 * │  DELETE /api/doctors/:id         (admin)            │
 * │                                                     │
 * │  GET    /api/services            (staff+)           │
 * │  POST   /api/services            (admin)            │
 * │  PUT    /api/services/:id        (admin)            │
 * │  DELETE /api/services/:id        (admin)            │
 * │                                                     │
 * │  GET    /api/appointments        (staff+)           │
 * │  POST   /api/appointments        (staff+)           │
 * │  GET    /api/appointments/:id    (staff+)           │
 * │  PUT    /api/appointments/:id    (staff+)           │
 * │  DELETE /api/appointments/:id    (admin)            │
 * │                                                     │
 * │  GET    /api/treatments          (doctor+)          │
 * │  POST   /api/treatments          (doctor+)          │
 * │  GET    /api/treatments/:id      (doctor+)          │
 * │  PUT    /api/treatments/:id      (doctor+)          │
 * │                                                     │
 * │  GET    /api/payments            (staff+)           │
 * │  POST   /api/payments            (staff+)           │
 * │  PUT    /api/payments/:id        (admin)            │
 * │                                                     │
 * │  GET    /api/users               (admin)            │
 * │  POST   /api/users               (admin)            │
 * │  PUT    /api/users/:id           (admin)            │
 * │  DELETE /api/users/:id           (admin)            │
 * │                                                     │
 * │  GET    /api/dashboard/stats     (staff+)           │
 * │  GET    /api/dashboard/calendar  (staff+)           │
 * └─────────────────────────────────────────────────────┘
 */

// ─── JWT (Web Crypto, HS256, zero dependencies) ───────────────────────────────

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

async function signJWT(payload, secret) {
  const enc = new TextEncoder();
  const header = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return `${data}.${b64url(sig)}`;
}

async function verifyJWT(token, secret) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const enc = new TextEncoder();
  const data = `${parts[0]}.${parts[1]}`;
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['verify']
  );
  const sigBin = b64urlDecode(parts[2]);
  const sigBytes = Uint8Array.from(sigBin, c => c.charCodeAt(0));
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(data));
  if (!valid) return null;
  try {
    const payload = JSON.parse(b64urlDecode(parts[1]));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── Password hashing (SHA-256 + salt, no bcrypt needed in Workers) ──────────

async function hashPassword(password) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest(
    'SHA-256',
    enc.encode(`dentacrm:${password}:tooth-harmony-salt-v1`)
  );
  return b64url(buf);
}

async function verifyPassword(password, hash) {
  const computed = await hashPassword(password);
  return computed === hash;
}

// ─── CORS & Response helpers ──────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function ok(data, meta = {}) {
  return jsonResp({ success: true, data, ...meta });
}

function err(message, status = 400, details = null) {
  return jsonResp({ success: false, error: message, ...(details ? { details } : {}) }, status);
}

function paginated(items, total, page, limit) {
  return jsonResp({
    success: true,
    data: items,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

let systemInitPromise = null;

function getConfigValue(env, key) {
  if (env && env[key]) return env[key];
  if (typeof process !== 'undefined' && process?.env?.[key]) return process.env[key];
  return undefined;
}

async function ensureSchema(env) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'administrator', full_name TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS patients (id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT NOT NULL, phone TEXT, email TEXT, date_of_birth TEXT, gender TEXT, address TEXT, notes TEXT, created_by INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS doctors (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, full_name TEXT NOT NULL, specialization TEXT, phone TEXT, email TEXT, color TEXT DEFAULT '#3B82F6', active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, price REAL NOT NULL DEFAULT 0, duration_minutes INTEGER NOT NULL DEFAULT 30, category TEXT, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS appointments (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL, doctor_id INTEGER NOT NULL, service_id INTEGER, scheduled_at TEXT NOT NULL, duration_minutes INTEGER NOT NULL DEFAULT 30, status TEXT NOT NULL DEFAULT 'scheduled', notes TEXT, created_by INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS treatments (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL, doctor_id INTEGER NOT NULL, appointment_id INTEGER, tooth_number INTEGER, diagnosis TEXT, procedure TEXT NOT NULL, notes TEXT, cost REAL NOT NULL DEFAULT 0, treated_at TEXT NOT NULL DEFAULT (datetime('now')), created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL, treatment_id INTEGER, amount REAL NOT NULL DEFAULT 0, method TEXT NOT NULL DEFAULT 'cash', status TEXT NOT NULL DEFAULT 'paid', notes TEXT, paid_at TEXT NOT NULL DEFAULT (datetime('now')), created_by INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS medical_files (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL, tooth_number INTEGER, treatment_id INTEGER, doctor_id INTEGER, category TEXT NOT NULL DEFAULT 'document', file_name TEXT NOT NULL, mime_type TEXT, size_bytes INTEGER NOT NULL DEFAULT 0, note TEXT, content_base64 TEXT NOT NULL, created_by INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email)`,
    `CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id)`,
    `CREATE INDEX IF NOT EXISTS idx_treatments_patient_id ON treatments(patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_treatments_doctor_id ON treatments(doctor_id)`,
    `CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_medical_files_patient_id ON medical_files(patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_medical_files_tooth_number ON medical_files(tooth_number)`,
  ];

  for (const sql of statements) {
    await env.DB.prepare(sql).run();
  }
}

async function ensureSuperUser(env) {
  const email = getConfigValue(env, 'SUPERUSER_EMAIL');
  const password = getConfigValue(env, 'SUPERUSER_PASSWORD');
  const fullName = getConfigValue(env, 'SUPERUSER_NAME') || 'System Superuser';
  if (!email || !password) return;

  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await hashPassword(password);
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(normalizedEmail).first();

  if (existing) {
    await env.DB.prepare("UPDATE users SET password_hash = ?, role = 'superuser', full_name = ?, active = 1, updated_at = datetime('now') WHERE id = ?")
      .bind(passwordHash, fullName.trim(), existing.id)
      .run();
  } else {
    await env.DB.prepare("INSERT INTO users (email, password_hash, role, full_name, active) VALUES (?, ?, 'superuser', ?, 1)")
      .bind(normalizedEmail, passwordHash, fullName.trim())
      .run();
  }

  const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(normalizedEmail).first();
  const doctor = await env.DB.prepare('SELECT id FROM doctors WHERE user_id = ? OR email = ?').bind(user.id, normalizedEmail).first();

  if (doctor) {
    await env.DB.prepare("UPDATE doctors SET full_name = ?, email = ?, active = 1, updated_at = datetime('now') WHERE id = ?")
      .bind(fullName.trim(), normalizedEmail, doctor.id)
      .run();
  } else {
    await env.DB.prepare("INSERT INTO doctors (user_id, full_name, specialization, email, color, active) VALUES (?, ?, 'Administrator', ?, '#DC2626', 1)")
      .bind(user.id, fullName.trim(), normalizedEmail)
      .run();
  }
}

async function ensureRoleMigration(env) {
  await env.DB.prepare("UPDATE users SET role = 'administrator' WHERE role IN ('admin', 'staff', 'assistant')").run();
}

async function syncDoctorProfiles(env) {
  const users = await env.DB
    .prepare("SELECT id, email, role, full_name, active FROM users WHERE role IN ('doctor', 'superuser')")
    .all();

  for (const user of users.results) {
    const existingDoctor = await env.DB
      .prepare('SELECT id FROM doctors WHERE user_id = ? OR email = ?')
      .bind(user.id, user.email)
      .first();

    const color = user.role === 'superuser' ? '#DC2626' : '#3B82F6';
    const specialization = user.role === 'superuser' ? 'Administrator' : 'Dentist';

    if (existingDoctor) {
      await env.DB.prepare(`
        UPDATE doctors
        SET user_id = ?, full_name = ?, specialization = ?, email = ?, color = ?, active = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        user.id,
        user.full_name,
        specialization,
        user.email,
        color,
        user.active ? 1 : 0,
        existingDoctor.id,
      ).run();
    } else {
      await env.DB.prepare(`
        INSERT INTO doctors (user_id, full_name, specialization, email, color, active)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        user.id,
        user.full_name,
        specialization,
        user.email,
        color,
        user.active ? 1 : 0,
      ).run();
    }
  }
}

async function ensureSystem(env) {
  if (!systemInitPromise) {
    systemInitPromise = (async () => {
      await ensureSchema(env);
      await ensureRoleMigration(env);
      await ensureSuperUser(env);
      await syncDoctorProfiles(env);
    })().catch((error) => {
      systemInitPromise = null;
      throw error;
    });
  }

  return systemInitPromise;
}

// ─── Auth middleware ──────────────────────────────────────────────────────────

async function authenticate(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return null;
  const user = await env.DB
    .prepare('SELECT id, email, role, full_name, active FROM users WHERE id = ?')
    .bind(payload.sub)
    .first();
  if (!user || !user.active) return null;
  return user;
}

async function requireAuth(request, env) {
  const user = await authenticate(request, env);
  if (!user) return [null, err('Unauthorized – valid Bearer token required', 401)];
  return [user, null];
}

function isSuperuser(user) {
  return user?.role === 'superuser';
}

function hasAnyRole(user, roles) {
  return Boolean(user && (isSuperuser(user) || roles.includes(user.role)));
}

function canManageRole(actor, role) {
  if (isSuperuser(actor)) return true;
  if (!actor) return false;
  if (!['doctor', 'administrator'].includes(actor.role)) return false;
  return role === 'doctor' || role === 'administrator';
}

function canEditUser(actor, targetUserId) {
  if (isSuperuser(actor)) return true;
  return Boolean(actor && String(actor.id) === String(targetUserId));
}

function canDeleteUser(actor, targetRole) {
  if (isSuperuser(actor)) return true;
  return actor?.role === 'doctor' && (targetRole === 'doctor' || targetRole === 'administrator');
}

async function setDoctorProfileForUser(env, userId, options = {}) {
  const user = await env.DB
    .prepare('SELECT id, email, role, full_name, active FROM users WHERE id = ?')
    .bind(userId)
    .first();
  if (!user) return;

  const existingDoctor = await env.DB
    .prepare('SELECT id FROM doctors WHERE user_id = ? OR email = ?')
    .bind(user.id, user.email)
    .first();

  if (user.role !== 'doctor' && user.role !== 'superuser') {
    if (existingDoctor) {
      await env.DB.prepare("UPDATE doctors SET active = 0, updated_at = datetime('now') WHERE id = ?")
        .bind(existingDoctor.id)
        .run();
    }
    return;
  }

  const specialization = options.specialization || (user.role === 'superuser' ? 'Administrator' : 'Dentist');
  const phone = options.phone || null;
  const color = options.color || (user.role === 'superuser' ? '#DC2626' : '#3B82F6');

  if (existingDoctor) {
    await env.DB.prepare(`
      UPDATE doctors
      SET user_id = ?, full_name = ?, specialization = ?, phone = COALESCE(?, phone), email = ?, color = ?, active = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      user.id,
      user.full_name,
      specialization,
      phone,
      user.email,
      color,
      user.active ? 1 : 0,
      existingDoctor.id,
    ).run();
  } else {
    await env.DB.prepare(`
      INSERT INTO doctors (user_id, full_name, specialization, phone, email, color, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      user.full_name,
      specialization,
      phone,
      user.email,
      color,
      user.active ? 1 : 0,
    ).run();
  }
}

async function requireRole(request, env, ...roles) {
  const [user, authErr] = await requireAuth(request, env);
  if (authErr) return [null, authErr];
  if (!hasAnyRole(user, roles)) {
    return [null, err(`Forbidden – required role: ${roles.join(' or ')}`, 403)];
  }
  return [user, null];
}

// ─── Input validation helpers ─────────────────────────────────────────────────

function validateRequired(body, fields) {
  const missing = fields.filter(f => body[f] == null || body[f] === '');
  if (missing.length) return `Missing required fields: ${missing.join(', ')}`;
  return null;
}

function buildUpdate(body, allowed) {
  const updates = allowed.filter(f => body[f] !== undefined);
  if (!updates.length) return [null, null];
  const sql = updates.map(f => `${f} = ?`).join(', ');
  const vals = updates.map(f => body[f]);
  return [sql, vals];
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

async function handleLogin(request, env) {
  const body = await request.json().catch(() => ({}));
  const missing = validateRequired(body, ['email', 'password']);
  if (missing) return err(missing);

  const user = await env.DB
    .prepare('SELECT * FROM users WHERE email = ? AND active = 1')
    .bind(body.email.toLowerCase().trim())
    .first();
  if (!user) return err('Invalid credentials', 401);

  // Handle placeholder bcrypt hashes from initial seeding
  let valid = false;
  if (user.password_hash.startsWith('$2')) {
    // First login: accept default password and re-hash with our scheme
    valid = body.password === 'DentaCRM2024!';
    if (valid) {
      const newHash = await hashPassword(body.password);
      await env.DB
        .prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(newHash, user.id)
        .run();
    }
  } else {
    valid = await verifyPassword(body.password, user.password_hash);
  }

  if (!valid) return err('Invalid credentials', 401);

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 h
  const token = await signJWT(
    { sub: user.id, email: user.email, role: user.role, exp },
    env.JWT_SECRET
  );

  return ok({
    token,
    user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
  });
}

async function handleMe(request, env) {
  const [user, authErr] = await requireAuth(request, env);
  if (authErr) return authErr;
  return ok(user);
}

async function handleChangePassword(request, env) {
  const [user, authErr] = await requireAuth(request, env);
  if (authErr) return authErr;
  const body = await request.json().catch(() => ({}));
  const missing = validateRequired(body, ['current_password', 'new_password']);
  if (missing) return err(missing);
  if (body.new_password.length < 8) return err('New password must be at least 8 characters');

  const dbUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
  const valid = dbUser.password_hash.startsWith('$2')
    ? body.current_password === 'DentaCRM2024!'
    : await verifyPassword(body.current_password, dbUser.password_hash);
  if (!valid) return err('Current password is incorrect', 401);

  const newHash = await hashPassword(body.new_password);
  await env.DB
    .prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(newHash, user.id)
    .run();
  return ok({ message: 'Password updated successfully' });
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENTS
// ─────────────────────────────────────────────────────────────────────────────

async function listPatients(request, env) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  const where = q ? "WHERE (full_name LIKE ? OR phone LIKE ? OR email LIKE ?)" : "";
  const params = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [];

  const [rows, countRow] = await Promise.all([
    env.DB.prepare(`SELECT * FROM patients ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...params, limit, offset).all(),
    env.DB.prepare(`SELECT COUNT(*) as cnt FROM patients ${where}`)
      .bind(...params).first(),
  ]);
  return paginated(rows.results, countRow.cnt, page, limit);
}

async function getPatient(id, env) {
  const patient = await env.DB
    .prepare('SELECT * FROM patients WHERE id = ?').bind(id).first();
  if (!patient) return err('Patient not found', 404);

  const [treatments, appointments, payments] = await Promise.all([
    env.DB.prepare(`
      SELECT t.*, d.full_name as doctor_name
      FROM treatments t LEFT JOIN doctors d ON t.doctor_id = d.id
      WHERE t.patient_id = ? ORDER BY t.treated_at DESC LIMIT 50
    `).bind(id).all(),
    env.DB.prepare(`
      SELECT a.*, d.full_name as doctor_name, s.name as service_name, s.price as service_price
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.patient_id = ? ORDER BY a.scheduled_at DESC LIMIT 50
    `).bind(id).all(),
    env.DB.prepare(`SELECT * FROM payments WHERE patient_id = ? ORDER BY paid_at DESC LIMIT 50`)
      .bind(id).all(),
  ]);

  return ok({
    ...patient,
    treatments: treatments.results,
    appointments: appointments.results,
    payments: payments.results,
  });
}

async function createPatient(request, env, user) {
  const body = await request.json().catch(() => ({}));
  const missing = validateRequired(body, ['full_name']);
  if (missing) return err(missing);

  const r = await env.DB.prepare(`
    INSERT INTO patients (full_name, phone, email, date_of_birth, gender, address, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    body.full_name.trim(),
    body.phone || null,
    body.email?.toLowerCase() || null,
    body.date_of_birth || null,
    body.gender || null,
    body.address || null,
    body.notes || null,
    user.id
  ).run();

  const patient = await env.DB
    .prepare('SELECT * FROM patients WHERE id = ?').bind(r.meta.last_row_id).first();
  return ok(patient);
}

async function updatePatient(id, request, env) {
  const exists = await env.DB.prepare('SELECT id FROM patients WHERE id = ?').bind(id).first();
  if (!exists) return err('Patient not found', 404);
  const body = await request.json().catch(() => ({}));
  const [sqlPart, vals] = buildUpdate(body,
    ['full_name', 'phone', 'email', 'date_of_birth', 'gender', 'address', 'notes']);
  if (!sqlPart) return err('No updatable fields provided');
  await env.DB
    .prepare(`UPDATE patients SET ${sqlPart}, updated_at = datetime('now') WHERE id = ?`)
    .bind(...vals, id).run();
  return ok(await env.DB.prepare('SELECT * FROM patients WHERE id = ?').bind(id).first());
}

async function deletePatient(id, env) {
  const exists = await env.DB.prepare('SELECT id FROM patients WHERE id = ?').bind(id).first();
  if (!exists) return err('Patient not found', 404);
  await env.DB.prepare('DELETE FROM patients WHERE id = ?').bind(id).run();
  return ok({ deleted: true, id: parseInt(id) });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCTORS
// ─────────────────────────────────────────────────────────────────────────────

async function listDoctors(request, env) {
  const url = new URL(request.url);
  const activeOnly = url.searchParams.get('active') !== 'false';
  const where = activeOnly ? 'WHERE active = 1' : '';
  const rows = await env.DB
    .prepare(`SELECT * FROM doctors ${where} ORDER BY full_name`).all();
  return ok(rows.results);
}

async function createDoctor(request, env) {
  const body = await request.json().catch(() => ({}));
  const missing = validateRequired(body, ['full_name']);
  if (missing) return err(missing);
  const r = await env.DB.prepare(`
    INSERT INTO doctors (user_id, full_name, specialization, phone, email, color)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    body.user_id || null, body.full_name.trim(),
    body.specialization || null, body.phone || null,
    body.email?.toLowerCase() || null, body.color || '#3B82F6'
  ).run();
  return ok(await env.DB.prepare('SELECT * FROM doctors WHERE id = ?').bind(r.meta.last_row_id).first());
}

async function updateDoctor(id, request, env) {
  const exists = await env.DB.prepare('SELECT id FROM doctors WHERE id = ?').bind(id).first();
  if (!exists) return err('Doctor not found', 404);
  const body = await request.json().catch(() => ({}));
  const [sqlPart, vals] = buildUpdate(body,
    ['full_name', 'specialization', 'phone', 'email', 'color', 'active']);
  if (!sqlPart) return err('No updatable fields provided');
  await env.DB.prepare(`UPDATE doctors SET ${sqlPart} WHERE id = ?`).bind(...vals, id).run();
  return ok(await env.DB.prepare('SELECT * FROM doctors WHERE id = ?').bind(id).first());
}

async function deleteDoctor(id, env) {
  const exists = await env.DB.prepare('SELECT id FROM doctors WHERE id = ?').bind(id).first();
  if (!exists) return err('Doctor not found', 404);
  // Soft delete
  await env.DB.prepare('UPDATE doctors SET active = 0 WHERE id = ?').bind(id).run();
  return ok({ deleted: true, id: parseInt(id) });
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────────────────────────────────────

async function listServices(request, env) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const activeOnly = url.searchParams.get('active') !== 'false';
  let where = activeOnly ? 'WHERE active = 1' : 'WHERE 1=1';
  const params = [];
  if (category) { where += ' AND category = ?'; params.push(category); }
  const rows = await env.DB
    .prepare(`SELECT * FROM services ${where} ORDER BY category, name`).bind(...params).all();
  return ok(rows.results);
}

async function createService(request, env) {
  const body = await request.json().catch(() => ({}));
  const missing = validateRequired(body, ['name', 'price']);
  if (missing) return err(missing);
  const r = await env.DB.prepare(`
    INSERT INTO services (name, description, price, duration_minutes, category)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    body.name.trim(), body.description || null,
    parseFloat(body.price), parseInt(body.duration_minutes) || 30,
    body.category || null
  ).run();
  return ok(await env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(r.meta.last_row_id).first());
}

async function updateService(id, request, env) {
  const exists = await env.DB.prepare('SELECT id FROM services WHERE id = ?').bind(id).first();
  if (!exists) return err('Service not found', 404);
  const body = await request.json().catch(() => ({}));
  const [sqlPart, vals] = buildUpdate(body,
    ['name', 'description', 'price', 'duration_minutes', 'category', 'active']);
  if (!sqlPart) return err('No updatable fields provided');
  await env.DB.prepare(`UPDATE services SET ${sqlPart} WHERE id = ?`).bind(...vals, id).run();
  return ok(await env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(id).first());
}

async function deleteService(id, env) {
  const exists = await env.DB.prepare('SELECT id FROM services WHERE id = ?').bind(id).first();
  if (!exists) return err('Service not found', 404);
  await env.DB.prepare('UPDATE services SET active = 0 WHERE id = ?').bind(id).run();
  return ok({ deleted: true, id: parseInt(id) });
}

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENTS
// ─────────────────────────────────────────────────────────────────────────────

async function listAppointments(request, env) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');         // YYYY-MM-DD
  const dateFrom = url.searchParams.get('date_from');
  const dateTo = url.searchParams.get('date_to');
  const doctorId = url.searchParams.get('doctor_id');
  const patientId = url.searchParams.get('patient_id');
  const status = url.searchParams.get('status');
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(200, parseInt(url.searchParams.get('limit') || '50'));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];
  if (date) { conditions.push("date(a.scheduled_at) = ?"); params.push(date); }
  if (dateFrom) { conditions.push("date(a.scheduled_at) >= ?"); params.push(dateFrom); }
  if (dateTo) { conditions.push("date(a.scheduled_at) <= ?"); params.push(dateTo); }
  if (doctorId) { conditions.push("a.doctor_id = ?"); params.push(doctorId); }
  if (patientId) { conditions.push("a.patient_id = ?"); params.push(patientId); }
  if (status) { conditions.push("a.status = ?"); params.push(status); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows, countRow] = await Promise.all([
    env.DB.prepare(`
      SELECT a.*,
        p.full_name  AS patient_name,  p.phone    AS patient_phone,
        d.full_name  AS doctor_name,   d.color    AS doctor_color,
        s.name       AS service_name,  s.price    AS service_price,
        s.duration_minutes AS service_duration
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors  d ON a.doctor_id  = d.id
      LEFT JOIN services s ON a.service_id = s.id
      ${where} ORDER BY a.scheduled_at ASC LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all(),
    env.DB.prepare(`SELECT COUNT(*) as cnt FROM appointments a ${where}`)
      .bind(...params).first(),
  ]);
  return paginated(rows.results, countRow.cnt, page, limit);
}

async function getAppointment(id, env) {
  const row = await env.DB.prepare(`
    SELECT a.*,
      p.full_name AS patient_name, p.phone AS patient_phone,
      d.full_name AS doctor_name,
      s.name AS service_name, s.price AS service_price
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN doctors  d ON a.doctor_id  = d.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE a.id = ?
  `).bind(id).first();
  if (!row) return err('Appointment not found', 404);
  return ok(row);
}

async function createAppointment(request, env, user) {
  const body = await request.json().catch(() => ({}));
  const missing = validateRequired(body, ['patient_id', 'doctor_id', 'scheduled_at']);
  if (missing) return err(missing);

  const r = await env.DB.prepare(`
    INSERT INTO appointments
      (patient_id, doctor_id, service_id, scheduled_at, duration_minutes, status, notes, created_by)
    VALUES (?, ?, ?, ?, ?, 'scheduled', ?, ?)
  `).bind(
    body.patient_id, body.doctor_id, body.service_id || null,
    body.scheduled_at, parseInt(body.duration_minutes) || 30,
    body.notes || null, user.id
  ).run();
  return ok(await env.DB.prepare('SELECT * FROM appointments WHERE id = ?').bind(r.meta.last_row_id).first());
}

async function updateAppointment(id, request, env) {
  const exists = await env.DB.prepare('SELECT id FROM appointments WHERE id = ?').bind(id).first();
  if (!exists) return err('Appointment not found', 404);
  const body = await request.json().catch(() => ({}));
  const [sqlPart, vals] = buildUpdate(body,
    ['scheduled_at', 'duration_minutes', 'status', 'notes', 'doctor_id', 'service_id', 'patient_id']);
  if (!sqlPart) return err('No updatable fields provided');
  await env.DB
    .prepare(`UPDATE appointments SET ${sqlPart}, updated_at = datetime('now') WHERE id = ?`)
    .bind(...vals, id).run();
  return ok(await env.DB.prepare('SELECT * FROM appointments WHERE id = ?').bind(id).first());
}

async function deleteAppointment(id, env) {
  const exists = await env.DB.prepare('SELECT id FROM appointments WHERE id = ?').bind(id).first();
  if (!exists) return err('Appointment not found', 404);
  await env.DB.prepare('DELETE FROM appointments WHERE id = ?').bind(id).run();
  return ok({ deleted: true, id: parseInt(id) });
}

// ─────────────────────────────────────────────────────────────────────────────
// TREATMENTS
// ─────────────────────────────────────────────────────────────────────────────

async function listTreatments(request, env) {
  const url = new URL(request.url);
  const patientId = url.searchParams.get('patient_id');
  const doctorId = url.searchParams.get('doctor_id');
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '20'));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];
  if (patientId) { conditions.push('t.patient_id = ?'); params.push(patientId); }
  if (doctorId) { conditions.push('t.doctor_id = ?'); params.push(doctorId); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows, countRow] = await Promise.all([
    env.DB.prepare(`
      SELECT t.*,
        p.full_name AS patient_name,
        d.full_name AS doctor_name
      FROM treatments t
      LEFT JOIN patients p ON t.patient_id = p.id
      LEFT JOIN doctors  d ON t.doctor_id  = d.id
      ${where} ORDER BY t.treated_at DESC LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all(),
    env.DB.prepare(`SELECT COUNT(*) as cnt FROM treatments t ${where}`)
      .bind(...params).first(),
  ]);
  return paginated(rows.results, countRow.cnt, page, limit);
}

async function getTreatment(id, env) {
  const row = await env.DB.prepare(`
    SELECT t.*,
      p.full_name AS patient_name,
      d.full_name AS doctor_name
    FROM treatments t
    LEFT JOIN patients p ON t.patient_id = p.id
    LEFT JOIN doctors  d ON t.doctor_id  = d.id
    WHERE t.id = ?
  `).bind(id).first();
  if (!row) return err('Treatment not found', 404);
  return ok(row);
}

async function createTreatment(request, env) {
  const body = await request.json().catch(() => ({}));
  const missing = validateRequired(body, ['patient_id', 'doctor_id', 'procedure']);
  if (missing) return err(missing);
  const r = await env.DB.prepare(`
    INSERT INTO treatments
      (patient_id, doctor_id, appointment_id, tooth_number, diagnosis, procedure, notes, cost, treated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    body.patient_id, body.doctor_id, body.appointment_id || null,
    body.tooth_number || null, body.diagnosis || null, body.procedure,
    body.notes || null, parseFloat(body.cost) || 0,
    body.treated_at || new Date().toISOString()
  ).run();
  return ok(await env.DB.prepare('SELECT * FROM treatments WHERE id = ?').bind(r.meta.last_row_id).first());
}

async function updateTreatment(id, request, env) {
  const exists = await env.DB.prepare('SELECT id FROM treatments WHERE id = ?').bind(id).first();
  if (!exists) return err('Treatment not found', 404);
  const body = await request.json().catch(() => ({}));
  const [sqlPart, vals] = buildUpdate(body,
    ['tooth_number', 'diagnosis', 'procedure', 'notes', 'cost', 'treated_at']);
  if (!sqlPart) return err('No updatable fields provided');
  await env.DB.prepare(`UPDATE treatments SET ${sqlPart} WHERE id = ?`).bind(...vals, id).run();
  return ok(await env.DB.prepare('SELECT * FROM treatments WHERE id = ?').bind(id).first());
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

async function listPayments(request, env) {
  const url = new URL(request.url);
  const patientId = url.searchParams.get('patient_id');
  const status = url.searchParams.get('status');
  const dateFrom = url.searchParams.get('date_from');
  const dateTo = url.searchParams.get('date_to');
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '20'));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];
  if (patientId) { conditions.push('pay.patient_id = ?'); params.push(patientId); }
  if (status) { conditions.push('pay.status = ?'); params.push(status); }
  if (dateFrom) { conditions.push("date(pay.paid_at) >= ?"); params.push(dateFrom); }
  if (dateTo) { conditions.push("date(pay.paid_at) <= ?"); params.push(dateTo); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows, countRow] = await Promise.all([
    env.DB.prepare(`
      SELECT pay.*, p.full_name AS patient_name
      FROM payments pay LEFT JOIN patients p ON pay.patient_id = p.id
      ${where} ORDER BY pay.paid_at DESC LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all(),
    env.DB.prepare(`SELECT COUNT(*) as cnt FROM payments pay ${where}`)
      .bind(...params).first(),
  ]);
  return paginated(rows.results, countRow.cnt, page, limit);
}

async function createPayment(request, env, user) {
  const body = await request.json().catch(() => ({}));
  const missing = validateRequired(body, ['patient_id', 'amount']);
  if (missing) return err(missing);
  const r = await env.DB.prepare(`
    INSERT INTO payments (patient_id, treatment_id, amount, method, status, notes, paid_at, created_by)
    VALUES (?, ?, ?, ?, 'paid', ?, ?, ?)
  `).bind(
    body.patient_id, body.treatment_id || null,
    parseFloat(body.amount), body.method || 'cash',
    body.notes || null,
    body.paid_at || new Date().toISOString(),
    user.id
  ).run();
  return ok(await env.DB.prepare('SELECT * FROM payments WHERE id = ?').bind(r.meta.last_row_id).first());
}

async function updatePayment(id, request, env) {
  const exists = await env.DB.prepare('SELECT id FROM payments WHERE id = ?').bind(id).first();
  if (!exists) return err('Payment not found', 404);
  const body = await request.json().catch(() => ({}));
  const [sqlPart, vals] = buildUpdate(body, ['amount', 'method', 'status', 'notes', 'paid_at']);
  if (!sqlPart) return err('No updatable fields provided');
  await env.DB.prepare(`UPDATE payments SET ${sqlPart} WHERE id = ?`).bind(...vals, id).run();
  return ok(await env.DB.prepare('SELECT * FROM payments WHERE id = ?').bind(id).first());
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDICAL FILES
// ─────────────────────────────────────────────────────────────────────────────

async function listMedicalFiles(request, env) {
  const url = new URL(request.url);
  const patientId = url.searchParams.get('patient_id');
  const toothNumber = url.searchParams.get('tooth_number');
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(500, parseInt(url.searchParams.get('limit') || '200'));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];
  if (patientId) { conditions.push('mf.patient_id = ?'); params.push(patientId); }
  if (toothNumber) { conditions.push('mf.tooth_number = ?'); params.push(toothNumber); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows, countRow] = await Promise.all([
    env.DB.prepare(`
      SELECT mf.id, mf.patient_id, mf.tooth_number, mf.treatment_id, mf.doctor_id, mf.category,
        mf.file_name, mf.mime_type, mf.size_bytes, mf.note, mf.created_at, mf.updated_at,
        p.full_name AS patient_name, d.full_name AS doctor_name
      FROM medical_files mf
      LEFT JOIN patients p ON mf.patient_id = p.id
      LEFT JOIN doctors d ON mf.doctor_id = d.id
      ${where} ORDER BY mf.created_at DESC LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all(),
    env.DB.prepare(`SELECT COUNT(*) as cnt FROM medical_files mf ${where}`)
      .bind(...params).first(),
  ]);

  return paginated(rows.results, countRow.cnt, page, limit);
}

async function createMedicalFile(request, env, user) {
  const body = await request.json().catch(() => ({}));
  const missing = validateRequired(body, ['patient_id', 'file_name', 'content_base64']);
  if (missing) return err(missing);

  const r = await env.DB.prepare(`
    INSERT INTO medical_files
      (patient_id, tooth_number, treatment_id, doctor_id, category, file_name, mime_type, size_bytes, note, content_base64, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    body.patient_id,
    body.tooth_number || null,
    body.treatment_id || null,
    body.doctor_id || null,
    body.category || 'document',
    body.file_name.trim(),
    body.mime_type || 'application/octet-stream',
    parseInt(body.size_bytes) || 0,
    body.note || null,
    body.content_base64,
    user.id,
  ).run();

  const row = await env.DB.prepare(`
    SELECT id, patient_id, tooth_number, treatment_id, doctor_id, category, file_name, mime_type,
      size_bytes, note, created_at, updated_at
    FROM medical_files
    WHERE id = ?
  `).bind(r.meta.last_row_id).first();

  return ok(row);
}

async function getMedicalFile(id, env) {
  const row = await env.DB.prepare(`
    SELECT id, patient_id, tooth_number, treatment_id, doctor_id, category, file_name, mime_type,
      size_bytes, note, created_at, updated_at
    FROM medical_files
    WHERE id = ?
  `).bind(id).first();

  if (!row) return err('Medical file not found', 404);
  return ok(row);
}

async function downloadMedicalFile(id, env) {
  const row = await env.DB.prepare(`
    SELECT file_name, mime_type, content_base64
    FROM medical_files
    WHERE id = ?
  `).bind(id).first();

  if (!row) return err('Medical file not found', 404);

  const binary = Uint8Array.from(atob(row.content_base64), (char) => char.charCodeAt(0));
  return new Response(binary, {
    status: 200,
    headers: {
      'Content-Type': row.mime_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${row.file_name}"`,
      ...CORS,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS (admin only)
// ─────────────────────────────────────────────────────────────────────────────

async function listUsers(env) {
  const rows = await env.DB
    .prepare('SELECT id, email, role, full_name, active, created_at FROM users ORDER BY full_name')
    .all();
  return ok(rows.results);
}

async function createUser(request, env, actor) {
  const body = await request.json().catch(() => ({}));
  const missing = validateRequired(body, ['email', 'password', 'full_name', 'role']);
  if (missing) return err(missing);
  if (!['superuser', 'administrator', 'doctor'].includes(body.role)) return err('Invalid role');
  if (!canManageRole(actor, body.role)) return err('Forbidden', 403);
  const exists = await env.DB
    .prepare('SELECT id FROM users WHERE email = ?').bind(body.email.toLowerCase()).first();
  if (exists) return err('Email already registered', 409);
  const hash = await hashPassword(body.password);
  const r = await env.DB.prepare(`
    INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)
  `).bind(body.email.toLowerCase().trim(), hash, body.role, body.full_name.trim()).run();
  const user = await env.DB
    .prepare('SELECT id, email, role, full_name, active, created_at FROM users WHERE id = ?')
    .bind(r.meta.last_row_id).first();
  await setDoctorProfileForUser(env, r.meta.last_row_id);
  return ok(user);
}

async function updateUser(id, request, env, actor) {
  const existingUser = await env.DB
    .prepare('SELECT id, email, role, full_name, active FROM users WHERE id = ?')
    .bind(id)
    .first();
  if (!existingUser) return err('User not found', 404);
  if (!canEditUser(actor, id)) return err('Forbidden', 403);
  const body = await request.json().catch(() => ({}));
  const updates = [];
  const vals = [];
  if (body.full_name) { updates.push('full_name = ?'); vals.push(body.full_name.trim()); }
  if (body.role && ['superuser', 'administrator', 'doctor'].includes(body.role)) {
    if (!isSuperuser(actor)) return err('Only superuser can change roles', 403);
    if (!canManageRole(actor, body.role)) return err('Forbidden', 403);
    updates.push('role = ?'); vals.push(body.role);
  }
  if (body.active !== undefined) {
    if (!isSuperuser(actor)) return err('Only superuser can change active state', 403);
    updates.push('active = ?'); vals.push(body.active ? 1 : 0);
  }
  if (body.password) {
    const h = await hashPassword(body.password);
    updates.push('password_hash = ?'); vals.push(h);
  }
  if (!updates.length) return err('No updatable fields provided');
  updates.push("updated_at = datetime('now')");
  await env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...vals, id).run();
  await setDoctorProfileForUser(env, id);
  return ok(await env.DB
    .prepare('SELECT id, email, role, full_name, active, created_at FROM users WHERE id = ?')
    .bind(id).first());
}

async function deleteUser(id, env, actor) {
  const existingUser = await env.DB
    .prepare('SELECT id, email, role, full_name, active FROM users WHERE id = ?')
    .bind(id)
    .first();
  if (!existingUser) return err('User not found', 404);
  if (!canDeleteUser(actor, existingUser.role)) return err('Forbidden', 403);
  await env.DB.prepare('UPDATE users SET active = 0 WHERE id = ?').bind(id).run();
  await setDoctorProfileForUser(env, id);
  return ok({ deleted: true, id: parseInt(id) });
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

async function getDashboardStats(env) {
  const today = new Date().toISOString().slice(0, 10);
  const [
    totalPatients, totalDoctors, totalServices,
    apptToday, apptUpcoming, apptCompleted,
    revenue30d, revenueToday,
    recentAppt, topServices,
  ] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as cnt FROM patients").first(),
    env.DB.prepare("SELECT COUNT(*) as cnt FROM doctors WHERE active = 1").first(),
    env.DB.prepare("SELECT COUNT(*) as cnt FROM services WHERE active = 1").first(),
    env.DB.prepare(`
      SELECT COUNT(*) as cnt FROM appointments
      WHERE date(scheduled_at) = ? AND status != 'cancelled'
    `).bind(today).first(),
    env.DB.prepare(`
      SELECT COUNT(*) as cnt FROM appointments
      WHERE scheduled_at >= datetime('now') AND status IN ('scheduled', 'confirmed')
    `).first(),
    env.DB.prepare("SELECT COUNT(*) as cnt FROM appointments WHERE status = 'completed'").first(),
    env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total FROM payments
      WHERE status = 'paid' AND date(paid_at) >= date('now', '-30 days')
    `).first(),
    env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total FROM payments
      WHERE status = 'paid' AND date(paid_at) = ?
    `).bind(today).first(),
    env.DB.prepare(`
      SELECT a.scheduled_at, a.status,
        p.full_name AS patient_name, p.phone AS patient_phone,
        d.full_name AS doctor_name,
        s.name AS service_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors  d ON a.doctor_id  = d.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE date(a.scheduled_at) >= date('now', '-7 days')
      ORDER BY a.scheduled_at DESC LIMIT 10
    `).all(),
    env.DB.prepare(`
      SELECT s.name, COUNT(a.id) as bookings
      FROM appointments a JOIN services s ON a.service_id = s.id
      WHERE a.status = 'completed'
      GROUP BY s.id ORDER BY bookings DESC LIMIT 5
    `).all(),
  ]);

  return ok({
    totals: {
      patients: totalPatients.cnt,
      doctors: totalDoctors.cnt,
      services: totalServices.cnt,
    },
    appointments: {
      today: apptToday.cnt,
      upcoming: apptUpcoming.cnt,
      completed: apptCompleted.cnt,
    },
    revenue: {
      today: revenueToday.total,
      last_30_days: revenue30d.total,
    },
    recent_appointments: recentAppt.results,
    top_services: topServices.results,
  });
}

async function getCalendar(request, env) {
  const url = new URL(request.url);
  const year = parseInt(url.searchParams.get('year') || new Date().getFullYear());
  const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1));
  const doctorId = url.searchParams.get('doctor_id');

  const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
  const dateToDate = new Date(year, month, 0);
  const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(dateToDate.getDate()).padStart(2, '0')}`;

  const conditions = ["date(a.scheduled_at) BETWEEN ? AND ?"];
  const params = [dateFrom, dateTo];
  if (doctorId) { conditions.push("a.doctor_id = ?"); params.push(doctorId); }

  const rows = await env.DB.prepare(`
    SELECT a.id, a.scheduled_at, a.duration_minutes, a.status,
      p.full_name AS patient_name,
      d.full_name AS doctor_name, d.color AS doctor_color,
      s.name AS service_name
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN doctors  d ON a.doctor_id  = d.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY a.scheduled_at ASC
  `).bind(...params).all();

  return ok(rows.results);
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const { method } = request;
    const url = new URL(request.url);
    const path = url.pathname;

    // ── CORS preflight ──────────────────────────────────────────────────────
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ── Only handle /api/* ──────────────────────────────────────────────────
    if (!path.startsWith('/api/')) {
      return err('Not found', 404);
    }

    // Normalize path: strip /api prefix
    const p = path.replace(/^\/api/, '').replace(/\/$/, '') || '/';

    try {
      await ensureSystem(env);
      // ── Public routes ──────────────────────────────────────────────────────
      if (p === '/auth/login'    && method === 'POST') return handleLogin(request, env);
      if (p === '/auth/logout'   && method === 'POST') return ok({ message: 'Logged out' });
      if (p === '/auth/me'       && method === 'GET')  return handleMe(request, env);
      if (p === '/auth/password' && method === 'PUT')  return handleChangePassword(request, env);

      // ── All other routes: require auth ─────────────────────────────────────
      const user = await authenticate(request, env);
      if (!user) return err('Unauthorized – valid Bearer token required', 401);

      // ── Patients ─────────────────────────────────────────────────────────
      if (p === '/patients') {
        if (method === 'GET')  return listPatients(request, env);
        if (method === 'POST') return createPatient(request, env, user);
      }
      const pm = p.match(/^\/patients\/(\d+)$/);
      if (pm) {
        if (method === 'GET')    return getPatient(pm[1], env);
        if (method === 'PUT')    return updatePatient(pm[1], request, env);
        if (method === 'DELETE') {
          if (!isSuperuser(user)) return err('Forbidden', 403);
          return deletePatient(pm[1], env);
        }
      }

      // ── Doctors ──────────────────────────────────────────────────────────
      if (p === '/doctors') {
        if (method === 'GET')  return listDoctors(request, env);
        if (method === 'POST') {
          if (!isSuperuser(user)) return err('Forbidden', 403);
          return createDoctor(request, env);
        }
      }
      const dm = p.match(/^\/doctors\/(\d+)$/);
      if (dm) {
        if (method === 'PUT' || method === 'DELETE') {
          if (!isSuperuser(user)) return err('Forbidden', 403);
          return method === 'PUT' ? updateDoctor(dm[1], request, env) : deleteDoctor(dm[1], env);
        }
      }

      // ── Services ─────────────────────────────────────────────────────────
      if (p === '/services') {
        if (method === 'GET')  return listServices(request, env);
        if (method === 'POST') {
          if (!isSuperuser(user)) return err('Forbidden', 403);
          return createService(request, env);
        }
      }
      const sm = p.match(/^\/services\/(\d+)$/);
      if (sm) {
        if (method === 'PUT' || method === 'DELETE') {
          if (!isSuperuser(user)) return err('Forbidden', 403);
          return method === 'PUT' ? updateService(sm[1], request, env) : deleteService(sm[1], env);
        }
      }

      // ── Appointments ─────────────────────────────────────────────────────
      if (p === '/appointments') {
        if (method === 'GET')  return listAppointments(request, env);
        if (method === 'POST') return createAppointment(request, env, user);
      }
      const am = p.match(/^\/appointments\/(\d+)$/);
      if (am) {
        if (method === 'GET')    return getAppointment(am[1], env);
        if (method === 'PUT')    return updateAppointment(am[1], request, env);
        if (method === 'DELETE') {
          if (!isSuperuser(user)) return err('Forbidden', 403);
          return deleteAppointment(am[1], env);
        }
      }

      // ── Treatments ───────────────────────────────────────────────────────
      if (p === '/treatments') {
        if (!hasAnyRole(user, ['doctor', 'administrator'])) return err('Forbidden', 403);
        if (method === 'GET')  return listTreatments(request, env);
        if (method === 'POST') return createTreatment(request, env);
      }
      const tm = p.match(/^\/treatments\/(\d+)$/);
      if (tm) {
        if (!hasAnyRole(user, ['doctor', 'administrator'])) return err('Forbidden', 403);
        if (method === 'GET') return getTreatment(tm[1], env);
        if (method === 'PUT') return updateTreatment(tm[1], request, env);
      }

      // ── Payments ─────────────────────────────────────────────────────────
      if (p === '/payments') {
        if (method === 'GET')  return listPayments(request, env);
        if (method === 'POST') return createPayment(request, env, user);
      }
      const paym = p.match(/^\/payments\/(\d+)$/);
      if (paym) {
        if (method === 'PUT') {
          if (!isSuperuser(user)) return err('Forbidden', 403);
          return updatePayment(paym[1], request, env);
        }
      }

      if (p === '/files') {
        if (method === 'GET')  return listMedicalFiles(request, env);
        if (method === 'POST') return createMedicalFile(request, env, user);
      }
      const fileMetaMatch = p.match(/^\/files\/(\d+)$/);
      if (fileMetaMatch && method === 'GET') return getMedicalFile(fileMetaMatch[1], env);
      const fileDownloadMatch = p.match(/^\/files\/(\d+)\/download$/);
      if (fileDownloadMatch && method === 'GET') return downloadMedicalFile(fileDownloadMatch[1], env);

      // ── Users (admin) ────────────────────────────────────────────────────
      if (p === '/users') {
        if (method === 'GET')  return listUsers(env);
        if (method === 'POST') return createUser(request, env, user);
      }
      const um = p.match(/^\/users\/(\d+)$/);
      if (um) {
        if (method === 'PUT')    return updateUser(um[1], request, env, user);
        if (method === 'DELETE') return deleteUser(um[1], env, user);
      }

      // ── Dashboard ────────────────────────────────────────────────────────
      if (p === '/dashboard/stats'    && method === 'GET') return getDashboardStats(env);
      if (p === '/dashboard/calendar' && method === 'GET') return getCalendar(request, env);

      return err('Not found', 404);

    } catch (e) {
      console.error('Worker error:', e);
      return err('Internal server error', 500);
    }
  },
};
