interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  AUTH_SECRET: string;
}

type Role = "superuser" | "administrator" | "doctor";
type FileCategory = "xray" | "scan" | "photo" | "document";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
  error?: string;
}

interface SessionUser {
  id: number;
  email: string;
  role: Role;
  full_name: string;
}

interface DbUser {
  id: number;
  email: string;
  password: string;
  role: Role;
  full_name: string;
  specialization: string | null;
  phone: string | null;
  active: number;
  created_at: string;
  updated_at: string;
}

const json = <T>(data: ApiResponse<T>, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

const error = (status: number, message: string) => json({ success: false, error: message }, status);

const toBooleanNumber = (value: unknown) => (value ? 1 : 0);

function normalizePath(pathname: string) {
  return pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
}

function getQueryInt(url: URL, key: string, fallback: number) {
  const raw = url.searchParams.get(key);
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function base64UrlEncode(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

async function signToken(secret: string, payload: Record<string, unknown>) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function verifyToken(secret: string, token: string) {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const signatureBytes = Uint8Array.from(base64UrlDecode(encodedSignature), (char) => char.charCodeAt(0));
  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
  );

  if (!isValid) return null;

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as {
    sub: number;
    email: string;
    role: Role;
    full_name: string;
    exp: number;
  };

  if (!payload.exp || Date.now() >= payload.exp) return null;

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    full_name: payload.full_name,
  } satisfies SessionUser;
}

async function requireAuth(request: Request, env: Env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return verifyToken(env.AUTH_SECRET, authHeader.slice(7));
}

async function getUserByEmail(db: D1Database, email: string) {
  return db
    .prepare(
      `SELECT id, email, password_hash AS password, role, full_name, specialization, phone, active, created_at, updated_at
       FROM users
       WHERE email = ?`
    )
    .bind(email.trim().toLowerCase())
    .first<DbUser>();
}

async function getActiveDoctors(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT id, full_name, specialization, email, phone, active
       FROM users
       WHERE role = 'doctor' AND active = 1
       ORDER BY full_name ASC`
    )
    .all();

  return result.results;
}

async function parseJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

async function handleLogin(request: Request, env: Env) {
  const body = await parseJson<{ email?: string; password?: string }>(request);
  if (!body?.email || !body.password) {
    return error(400, "Email and password are required.");
  }

  const user = await getUserByEmail(env.DB, body.email);
  if (!user || !user.active) {
    return error(401, "Invalid credentials.");
  }

  const incomingHash = await sha256(body.password);
  if (incomingHash !== user.password) {
    return error(401, "Invalid credentials.");
  }

  const token = await signToken(env.AUTH_SECRET, {
    sub: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    exp: Date.now() + 1000 * 60 * 60 * 12,
  });

  return json({
    success: true,
    data: {
      token,
      user: {
        id: String(user.id),
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
    },
  });
}

async function listPatients(request: Request, env: Env) {
  const url = new URL(request.url);
  const limit = getQueryInt(url, "limit", 100);
  const q = url.searchParams.get("q")?.trim();

  let statement = `SELECT id, full_name, phone, email, notes, created_at
                   FROM patients`;
  const bindings: unknown[] = [];

  if (q) {
    statement += ` WHERE lower(full_name) LIKE ? OR phone LIKE ? OR lower(email) LIKE ?`;
    const pattern = `%${q.toLowerCase()}%`;
    bindings.push(pattern, `%${q}%`, pattern);
  }

  statement += ` ORDER BY datetime(created_at) DESC LIMIT ?`;
  bindings.push(limit);

  const result = await env.DB.prepare(statement).bind(...bindings).all();
  return json({ success: true, data: result.results });
}

async function createPatient(request: Request, env: Env) {
  const body = await parseJson<{ full_name?: string; phone?: string | null; email?: string | null; notes?: string | null }>(request);
  if (!body?.full_name?.trim()) {
    return error(400, "Patient full_name is required.");
  }

  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO patients (full_name, phone, email, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      body.full_name.trim(),
      body.phone?.trim() || null,
      body.email?.trim().toLowerCase() || null,
      body.notes?.trim() || null,
      now,
      now,
    )
    .run();

  const patient = await env.DB.prepare(
    `SELECT id, full_name, phone, email, notes, created_at
     FROM patients
     WHERE id = ?`
  )
    .bind(result.meta.last_row_id)
    .first();

  return json({ success: true, data: patient }, 201);
}

async function deletePatient(pathname: string, env: Env) {
  const patientId = pathname.split("/").pop();
  if (!patientId) return error(400, "Patient id is required.");

  await env.DB.batch([
    env.DB.prepare(`DELETE FROM files WHERE patient_id = ?`).bind(patientId),
    env.DB.prepare(`DELETE FROM payments WHERE patient_id = ?`).bind(patientId),
    env.DB.prepare(`DELETE FROM treatments WHERE patient_id = ?`).bind(patientId),
    env.DB.prepare(`DELETE FROM appointments WHERE patient_id = ?`).bind(patientId),
    env.DB.prepare(`DELETE FROM patients WHERE id = ?`).bind(patientId),
  ]);

  return new Response(null, { status: 204 });
}

async function listDoctors(env: Env) {
  return json({ success: true, data: await getActiveDoctors(env.DB) });
}

async function listUsers(env: Env) {
  const result = await env.DB
    .prepare(
      `SELECT id, email, role, full_name, phone, active
       FROM users
       ORDER BY full_name ASC`
    )
    .all();

  return json({ success: true, data: result.results });
}

async function createUser(request: Request, env: Env) {
  const body = await parseJson<{
    full_name?: string;
    email?: string;
    password?: string;
    role?: Role;
    phone?: string | null;
    specialization?: string | null;
  }>(request);

  if (!body?.full_name?.trim() || !body.email?.trim() || !body.password?.trim() || !body.role) {
    return error(400, "full_name, email, password, and role are required.");
  }

  const existing = await getUserByEmail(env.DB, body.email);
  if (existing) {
    return error(409, "A user with this email already exists.");
  }

  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO users (email, password_hash, role, full_name, specialization, phone, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
  )
    .bind(
      body.email.trim().toLowerCase(),
      await sha256(body.password),
      body.role,
      body.full_name.trim(),
      body.specialization?.trim() || null,
      body.phone?.trim() || null,
      now,
      now,
    )
    .run();

  const created = await env.DB
    .prepare(`SELECT id, email, role, full_name, phone, active FROM users WHERE id = ?`)
    .bind(result.meta.last_row_id)
    .first();

  return json({ success: true, data: created }, 201);
}

async function updateUser(pathname: string, request: Request, env: Env) {
  const userId = pathname.split("/").pop();
  if (!userId) return error(400, "User id is required.");

  const existing = await env.DB
    .prepare(`SELECT id, email, role, full_name, specialization, phone, active FROM users WHERE id = ?`)
    .bind(userId)
    .first<DbUser>();

  if (!existing) return error(404, "User not found.");

  const body = await parseJson<{
    full_name?: string;
    password?: string;
    role?: Role;
    active?: boolean;
    phone?: string | null;
    specialization?: string | null;
  }>(request);

  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE users
     SET full_name = ?,
         password_hash = COALESCE(?, password_hash),
         role = ?,
         active = ?,
         phone = COALESCE(?, phone),
         specialization = COALESCE(?, specialization),
         updated_at = ?
     WHERE id = ?`
  )
    .bind(
      body?.full_name?.trim() || existing.full_name,
      body?.password?.trim() ? await sha256(body.password) : null,
      body?.role || existing.role,
      typeof body?.active === "boolean" ? toBooleanNumber(body.active) : existing.active,
      body?.phone?.trim() || null,
      body?.specialization?.trim() || null,
      now,
      userId,
    )
    .run();

  const updated = await env.DB
    .prepare(`SELECT id, email, role, full_name, phone, active FROM users WHERE id = ?`)
    .bind(userId)
    .first();

  return json({ success: true, data: updated });
}

async function deactivateUser(pathname: string, env: Env) {
  const userId = pathname.split("/").pop();
  if (!userId) return error(400, "User id is required.");

  await env.DB.prepare(`UPDATE users SET active = 0, updated_at = ? WHERE id = ?`)
    .bind(new Date().toISOString(), userId)
    .run();

  return new Response(null, { status: 204 });
}

async function listAppointments(request: Request, env: Env) {
  const url = new URL(request.url);
  const limit = getQueryInt(url, "limit", 200);
  const result = await env.DB
    .prepare(
      `SELECT a.id,
              a.patient_id,
              p.full_name AS patient_name,
              u.full_name AS doctor_name,
              a.scheduled_at,
              a.status,
              a.notes,
              a.service_name,
              a.duration_minutes
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       LEFT JOIN users u ON u.id = a.doctor_id
       ORDER BY datetime(a.scheduled_at) DESC
       LIMIT ?`
    )
    .bind(limit)
    .all();

  return json({ success: true, data: result.results });
}

async function createAppointment(request: Request, env: Env) {
  const body = await parseJson<{
    patient_id?: number;
    doctor_id?: number;
    scheduled_at?: string;
    duration_minutes?: number;
    notes?: string | null;
  }>(request);

  if (!body?.patient_id || !body.doctor_id || !body.scheduled_at) {
    return error(400, "patient_id, doctor_id, and scheduled_at are required.");
  }

  const patient = await env.DB.prepare(`SELECT id, full_name FROM patients WHERE id = ?`).bind(body.patient_id).first();
  const doctor = await env.DB.prepare(`SELECT id, full_name FROM users WHERE id = ? AND role = 'doctor'`).bind(body.doctor_id).first();
  if (!patient || !doctor) return error(404, "Related patient or doctor not found.");

  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, duration_minutes, status, notes, service_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'scheduled', ?, COALESCE(?, 'Visit'), ?, ?)`
  )
    .bind(
      body.patient_id,
      body.doctor_id,
      body.scheduled_at,
      body.duration_minutes || 30,
      body.notes?.trim() || null,
      body.notes?.trim() || null,
      now,
      now,
    )
    .run();

  const appointment = await env.DB
    .prepare(
      `SELECT a.id,
              a.patient_id,
              p.full_name AS patient_name,
              u.full_name AS doctor_name,
              a.scheduled_at,
              a.status,
              a.notes,
              a.service_name,
              a.duration_minutes
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       LEFT JOIN users u ON u.id = a.doctor_id
       WHERE a.id = ?`
    )
    .bind(result.meta.last_row_id)
    .first();

  return json({ success: true, data: appointment }, 201);
}

async function listTreatments(request: Request, env: Env) {
  const url = new URL(request.url);
  const limit = getQueryInt(url, "limit", 500);
  const result = await env.DB
    .prepare(
      `SELECT t.id,
              t.patient_id,
              p.full_name AS patient_name,
              t.doctor_id,
              u.full_name AS doctor_name,
              t.tooth_number,
              t.diagnosis,
              t.procedure,
              t.notes,
              t.cost,
              t.treated_at
       FROM treatments t
       JOIN patients p ON p.id = t.patient_id
       LEFT JOIN users u ON u.id = t.doctor_id
       ORDER BY datetime(t.treated_at) DESC
       LIMIT ?`
    )
    .bind(limit)
    .all();

  return json({ success: true, data: result.results });
}

async function createTreatment(request: Request, env: Env) {
  const body = await parseJson<{
    patient_id?: number;
    doctor_id?: number | null;
    tooth_number?: number | null;
    diagnosis?: string | null;
    procedure?: string;
    notes?: string | null;
    cost?: number | null;
    treated_at?: string;
  }>(request);

  if (!body?.patient_id || !body.procedure?.trim() || !body.treated_at) {
    return error(400, "patient_id, procedure, and treated_at are required.");
  }

  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO treatments (patient_id, doctor_id, tooth_number, diagnosis, procedure, notes, cost, treated_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      body.patient_id,
      body.doctor_id || null,
      body.tooth_number || null,
      body.diagnosis?.trim() || null,
      body.procedure.trim(),
      body.notes?.trim() || null,
      body.cost ?? 0,
      body.treated_at,
      now,
      now,
    )
    .run();

  const treatment = await env.DB
    .prepare(
      `SELECT t.id,
              t.patient_id,
              p.full_name AS patient_name,
              t.doctor_id,
              u.full_name AS doctor_name,
              t.tooth_number,
              t.diagnosis,
              t.procedure,
              t.notes,
              t.cost,
              t.treated_at
       FROM treatments t
       JOIN patients p ON p.id = t.patient_id
       LEFT JOIN users u ON u.id = t.doctor_id
       WHERE t.id = ?`
    )
    .bind(result.meta.last_row_id)
    .first();

  return json({ success: true, data: treatment }, 201);
}

async function listPayments(request: Request, env: Env) {
  const url = new URL(request.url);
  const limit = getQueryInt(url, "limit", 500);
  const result = await env.DB
    .prepare(
      `SELECT id, patient_id, treatment_id, amount, method, notes, paid_at, status
       FROM payments
       ORDER BY datetime(paid_at) DESC
       LIMIT ?`
    )
    .bind(limit)
    .all();

  return json({ success: true, data: result.results });
}

async function listFiles(request: Request, env: Env) {
  const url = new URL(request.url);
  const limit = getQueryInt(url, "limit", 1000);
  const result = await env.DB
    .prepare(
      `SELECT f.id,
              f.patient_id,
              f.tooth_number,
              f.treatment_id,
              f.doctor_id,
              u.full_name AS doctor_name,
              f.category,
              f.file_name,
              f.mime_type,
              f.size_bytes,
              f.note,
              f.created_at
       FROM files f
       LEFT JOIN users u ON u.id = f.doctor_id
       ORDER BY datetime(f.created_at) DESC
       LIMIT ?`
    )
    .bind(limit)
    .all();

  return json({ success: true, data: result.results });
}

async function createFile(request: Request, env: Env) {
  const body = await parseJson<{
    patient_id?: number;
    tooth_number?: number | null;
    treatment_id?: number | null;
    doctor_id?: number | null;
    category?: FileCategory;
    file_name?: string;
    mime_type?: string | null;
    size_bytes?: number | null;
    note?: string | null;
    content_base64?: string;
  }>(request);

  if (!body?.patient_id || !body.category || !body.file_name?.trim() || !body.content_base64) {
    return error(400, "patient_id, category, file_name, and content_base64 are required.");
  }

  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO files (
      patient_id, tooth_number, treatment_id, doctor_id, category, file_name, mime_type, size_bytes, note, content_base64, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      body.patient_id,
      body.tooth_number || null,
      body.treatment_id || null,
      body.doctor_id || null,
      body.category,
      body.file_name.trim(),
      body.mime_type?.trim() || "application/octet-stream",
      body.size_bytes ?? null,
      body.note?.trim() || null,
      body.content_base64,
      now,
      now,
    )
    .run();

  const file = await env.DB
    .prepare(
      `SELECT f.id,
              f.patient_id,
              f.tooth_number,
              f.treatment_id,
              f.doctor_id,
              u.full_name AS doctor_name,
              f.category,
              f.file_name,
              f.mime_type,
              f.size_bytes,
              f.note,
              f.created_at
       FROM files f
       LEFT JOIN users u ON u.id = f.doctor_id
       WHERE f.id = ?`
    )
    .bind(result.meta.last_row_id)
    .first();

  return json({ success: true, data: file }, 201);
}

async function downloadFile(pathname: string, env: Env) {
  const parts = pathname.split("/");
  const fileId = parts[parts.length - 2];
  if (!fileId) return error(400, "File id is required.");

  const file = await env.DB
    .prepare(`SELECT file_name, mime_type, content_base64 FROM files WHERE id = ?`)
    .bind(fileId)
    .first<{ file_name: string; mime_type: string | null; content_base64: string }>();

  if (!file) return error(404, "File not found.");

  const raw = Uint8Array.from(atob(file.content_base64), (char) => char.charCodeAt(0));

  return new Response(raw, {
    headers: {
      "Content-Type": file.mime_type || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.file_name)}`,
      "Cache-Control": "no-store",
    },
  });
}

async function getDashboardStats(env: Env) {
  const [totalsRow, appointmentsTodayRow, appointmentsUpcomingRow, appointmentsCompletedRow, revenueTodayRow, revenue30Row, recentAppointments, topServices] =
    await Promise.all([
      env.DB.prepare(
        `SELECT
           (SELECT COUNT(*) FROM patients) AS patients,
           (SELECT COUNT(*) FROM users WHERE role = 'doctor' AND active = 1) AS doctors,
           (SELECT COUNT(DISTINCT procedure) FROM treatments) AS services`
      ).first<{ patients: number; doctors: number; services: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS count FROM appointments WHERE date(scheduled_at) = date('now')`).first<{ count: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS count FROM appointments WHERE datetime(scheduled_at) >= datetime('now')`).first<{ count: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS count FROM appointments WHERE status = 'completed'`).first<{ count: number }>(),
      env.DB.prepare(`SELECT COALESCE(SUM(amount), 0) AS amount FROM payments WHERE date(paid_at) = date('now')`).first<{ amount: number }>(),
      env.DB.prepare(`SELECT COALESCE(SUM(amount), 0) AS amount FROM payments WHERE datetime(paid_at) >= datetime('now', '-30 days')`).first<{ amount: number }>(),
      env.DB.prepare(
        `SELECT a.scheduled_at, a.status, p.full_name AS patient_name, p.phone AS patient_phone, u.full_name AS doctor_name, a.service_name
         FROM appointments a
         JOIN patients p ON p.id = a.patient_id
         LEFT JOIN users u ON u.id = a.doctor_id
         ORDER BY datetime(a.scheduled_at) DESC
         LIMIT 5`
      ).all(),
      env.DB.prepare(
        `SELECT procedure AS name, COUNT(*) AS bookings
         FROM treatments
         GROUP BY procedure
         ORDER BY bookings DESC, name ASC
         LIMIT 5`
      ).all(),
    ]);

  return json({
    success: true,
    data: {
      totals: {
        patients: Number(totalsRow?.patients || 0),
        doctors: Number(totalsRow?.doctors || 0),
        services: Number(totalsRow?.services || 0),
      },
      appointments: {
        today: Number(appointmentsTodayRow?.count || 0),
        upcoming: Number(appointmentsUpcomingRow?.count || 0),
        completed: Number(appointmentsCompletedRow?.count || 0),
      },
      revenue: {
        today: Number(revenueTodayRow?.amount || 0),
        last_30_days: Number(revenue30Row?.amount || 0),
      },
      recent_appointments: recentAppointments.results,
      top_services: topServices.results,
    },
  });
}

async function routeApi(request: Request, env: Env, pathname: string) {
  const method = request.method.toUpperCase();

  if (pathname === "/api/auth/login" && method === "POST") {
    return handleLogin(request, env);
  }

  const session = await requireAuth(request, env);
  if (!session) {
    return error(401, "Unauthorized.");
  }

  void session;

  if (pathname === "/api/patients") {
    if (method === "GET") return listPatients(request, env);
    if (method === "POST") return createPatient(request, env);
  }

  if (pathname.startsWith("/api/patients/") && method === "DELETE") {
    return deletePatient(pathname, env);
  }

  if (pathname === "/api/doctors" && method === "GET") {
    return listDoctors(env);
  }

  if (pathname === "/api/users") {
    if (method === "GET") return listUsers(env);
    if (method === "POST") return createUser(request, env);
  }

  if (pathname.startsWith("/api/users/")) {
    if (method === "PUT") return updateUser(pathname, request, env);
    if (method === "DELETE") return deactivateUser(pathname, env);
  }

  if (pathname === "/api/appointments") {
    if (method === "GET") return listAppointments(request, env);
    if (method === "POST") return createAppointment(request, env);
  }

  if (pathname === "/api/treatments") {
    if (method === "GET") return listTreatments(request, env);
    if (method === "POST") return createTreatment(request, env);
  }

  if (pathname === "/api/payments" && method === "GET") {
    return listPayments(request, env);
  }

  if (pathname === "/api/files") {
    if (method === "GET") return listFiles(request, env);
    if (method === "POST") return createFile(request, env);
  }

  if (pathname.match(/^\/api\/files\/\d+\/download$/) && method === "GET") {
    return downloadFile(pathname, env);
  }

  if (pathname === "/api/dashboard/stats" && method === "GET") {
    return getDashboardStats(env);
  }

  return error(404, `Route not found: ${pathname}`);
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = normalizePath(url.pathname);

    if (pathname.startsWith("/api")) {
      try {
        return await routeApi(request, env as Env, pathname);
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Internal server error.";
        return error(500, message);
      }
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
