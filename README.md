# Tooth Harmony Pro

Фронтенд уже очікує API на маршрутах `/api/*`, тому в репозиторій додано окремий Cloudflare Worker у папці `worker/`, який:

- обслуговує REST API для авторизації, пацієнтів, працівників, лікарів, візитів, лікування, оплат, файлів та дашборду;
- використовує Cloudflare D1 як основну БД;
- віддає зібраний Vite SPA через assets binding.

## Структура backend-частини

- `worker/src/index.ts` — сам Worker з усіма API-ендпоінтами.
- `worker/migrations/0001_initial.sql` — повна схема БД.
- `worker/migrations/0002_seed.sql` — стартові демо-дані для локального запуску.
- `worker/wrangler.toml` — конфігурація Worker + D1 + assets.
- `worker/.dev.vars.example` — приклад локальних секретів.

## Що реалізовано в API

- `POST /api/auth/login`
- `GET/POST /api/patients`
- `DELETE /api/patients/:id`
- `GET /api/doctors`
- `GET/POST /api/users`
- `PUT/DELETE /api/users/:id`
- `GET/POST /api/appointments`
- `GET/POST /api/treatments`
- `GET /api/payments`
- `GET/POST /api/files`
- `GET /api/files/:id/download`
- `GET /api/dashboard/stats`

## Локальний запуск

### 1. Підготувати секрети

```bash
cp worker/.dev.vars.example worker/.dev.vars
```

### 2. Створити локальну D1 базу і застосувати міграції

```bash
npm run db:migrate:local
```

> Міграція `0002_seed.sql` уже містить стартові демо-дані, тому після застосування міграцій фронтенд можна одразу логінити і відкривати.

### 3. Запустити фронтенд

```bash
npm run dev
```

### 4. Запустити Worker API окремо

```bash
npm run dev:worker
```

### 5. Або перевірити production-like режим локально

```bash
npm run preview
```

## Стартові користувачі

- Адміністратор: `admin@clinic.com` / `password`
- Суперюзер: `superuser@clinic.local` / `supersecret`
- Лікарі: `ivanenko@clinic.com` / `doctor123`, `koval@clinic.com` / `doctor123`

## Перед деплоєм у Cloudflare

У `worker/wrangler.toml` обов'язково замініть:

- `database_id` на справжній ID вашої D1 бази;
- `AUTH_SECRET` на безпечний секрет через secrets/vars у Cloudflare.

Після цього можна виконати:

```bash
npm run deploy
```
