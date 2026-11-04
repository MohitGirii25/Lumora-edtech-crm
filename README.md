# Brightpath EdTech CRM

A React and Express inquiry CRM backed by PostgreSQL (including Supabase PostgreSQL). Visitors can submit inquiries; administrators can sign in, search and filter the inbox, inspect inquiry details, and update statuses.

## Stack

- Frontend: React, Vite, React Router, Axios
- Backend: Node.js, Express, PostgreSQL (`pg`), BCrypt, and signed JWTs
- Database: PostgreSQL, accessed by the backend through `DATABASE_URL`

## Run locally

### Requirements

- Node.js 20 or newer and npm
- A PostgreSQL database. For Supabase, use the connection URI from **Project → Connect**. Use the session pooler URI if your network requires IPv4.

### 1. Create the database schema

Run [`schema.sql`](schema.sql) in your database SQL editor. It creates the `admins` and `inquiries` tables, indexes, and database access protections. It also copies existing rows from an older `users` table into `admins` without overwriting existing admins.

### 2. Configure the backend

Copy `backend/.env.example` to `backend/.env` and replace the placeholders with your own values:

```dotenv
DATABASE_URL=postgresql://postgres:<url-encoded-password>@db.<project-ref>.supabase.co:5432/postgres
JWT_SECRET=<unique-random-secret-at-least-32-bytes>
JWT_EXPIRATION_MS=3600000
PORT=8081
APP_CORS_ALLOWED_ORIGIN=http://localhost:5173
ADMIN_BOOTSTRAP_NAME=Local Admin
ADMIN_BOOTSTRAP_EMAIL=admin@example.com
ADMIN_BOOTSTRAP_PASSWORD=<strong-password>
```

`DATABASE_URL` is your PostgreSQL connection URI. URL-encode reserved characters in the database password. Do not use a Supabase service-role key. Generate a random JWT secret (PowerShell example):

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

`JWT_SECRET` must contain at least 32 bytes. `JWT_EXPIRATION_MS` defaults to `3600000` (one hour) and must be at least `60000` (one minute). The three `ADMIN_BOOTSTRAP_*` values are optional, but must either all be set or all be blank. At startup, the backend creates the administrator only if that email does not already exist; it will not reset an existing password. After creating the initial account, remove the bootstrap values from `.env`.

### 3. Configure the frontend

Copy `frontend/.env.example` to `frontend/.env` and set the backend API root:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8081/api
```

Set `APP_CORS_ALLOWED_ORIGIN` to match the frontend origin in your browser (normally `http://localhost:5173`). Do not put `DATABASE_URL`, `JWT_SECRET`, or other server secrets in frontend variables; Vite variables are exposed to the browser.

### 4. Install and start

Run these commands from the repository root:

```sh
npm install
npm run dev
```

This starts the API and Vite frontend together. Open the frontend URL printed by Vite (normally `http://localhost:5173`). The public inquiry form is at `/`; administrator login is at `/admin/login`. Press `Ctrl+C` once to stop both processes. The API listens on port `8081` by default. API/database startup errors are retried with a capped delay, and Vite restarts if it stops.

## Test custom JWT authentication

Authentication is implemented by this Express backend; Supabase Auth is not used. The login route checks the administrator password against its BCrypt hash and returns a signed HS256 JWT. Protected routes require the token in the `Authorization: Bearer <token>` header. Tokens expire after the configured `JWT_EXPIRATION_MS`.

With the API running and an administrator account created, log in using that admin's email and password. For example, with `curl` in a shell:

```sh
curl -i -X POST http://127.0.0.1:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"<strong-password>"}'
```

A successful login returns HTTP `200` and JSON with a `token`, `expiresInMs`, and an `admin` object, for example:

```json
{"token":"<signed-jwt>","expiresInMs":3600000,"admin":{"id":1,"name":"Local Admin","email":"admin@example.com"}}
```

Copy the token and call a protected route. PowerShell example (use `curl.exe` so PowerShell does not substitute its `curl` alias):

```powershell
$token = '<paste-token-here>'
curl.exe -i http://127.0.0.1:8081/api/auth/me -H "Authorization: Bearer $token"
curl.exe -i http://127.0.0.1:8081/api/admin/inquiries -H "Authorization: Bearer $token"
```

`/api/auth/me` should return HTTP `200` and the authenticated admin object. Confirm the rejection behavior as well: a protected endpoint called without an authorization header returns HTTP `401` with `Authentication required.`; a malformed, altered, or expired token returns HTTP `401` with `Invalid or expired token.`; incorrect login credentials return HTTP `401`.

To check expiration locally, set `JWT_EXPIRATION_MS=60000` in `backend/.env`, restart the backend, log in again, wait at least one minute, and repeat the `/api/auth/me` request. The expired token should receive HTTP `401`. Restore the usual expiration value afterward. You can also exercise this flow through the admin login at `/admin/login`; the frontend stores the returned token in browser local storage and sends it with protected requests.

## API

All endpoints return JSON. The API base is `/api`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/inquiries` | Public | Validate and save an inquiry |
| `POST` | `/auth/login` | Public | Verify admin password and return a signed JWT |
| `GET` | `/auth/me` | Admin JWT | Validate the token and return the authenticated admin |
| `GET` | `/admin/inquiries` | Admin JWT | List inquiries; accepts `category`, `userType`, `search`, `page`, and `size` query parameters |
| `GET` | `/admin/inquiries/:id` | Admin JWT | Get inquiry details |
| `PATCH` | `/admin/inquiries/:id/status` | Admin JWT | Update status to `NEW`, `IN_PROGRESS`, or `RESOLVED` |
| `GET` | `/admin/inquiries/dashboard/stats` | Admin JWT | Get total and per-status counts |

Passwords are stored as BCrypt hashes. Admin API endpoints use bearer token authorization.

## Environment variable reference

| Variable | Used by | Description |
|---|---|---|
| `DATABASE_URL` | Backend | PostgreSQL connection URI |
| `JWT_SECRET` | Backend | Private JWT signing key; at least 32 bytes |
| `JWT_EXPIRATION_MS` | Backend | Token lifetime in milliseconds; defaults to `3600000`, minimum `60000` |
| `PORT` | Backend | API listening port; defaults to `8081` |
| `APP_CORS_ALLOWED_ORIGIN` | Backend | Allowed frontend origin(s), comma-separated; local localhost/127.0.0.1 origins are allowed in development |
| `ADMIN_BOOTSTRAP_NAME` | Backend | Optional initial admin name; set together with email and password |
| `ADMIN_BOOTSTRAP_EMAIL` | Backend | Optional initial admin email |
| `ADMIN_BOOTSTRAP_PASSWORD` | Backend | Optional initial admin password; stored as a BCrypt hash |
| `VITE_API_BASE_URL` | Frontend | Backend API root, such as `http://127.0.0.1:8081/api` |

Templates: [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example). Keep real `.env` files and server credentials out of source control.

## Build and deployment

Build the frontend with `npm run build --prefix frontend`. Start the API with `npm start --prefix backend`. For deployment, configure backend secrets in the hosting provider, set the correct frontend origin for CORS, set `VITE_API_BASE_URL` before building the frontend, and serve both apps over HTTPS.
