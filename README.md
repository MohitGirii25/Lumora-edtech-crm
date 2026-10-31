<!-- # Lumora EdTech CRM

A React and Express inquiry CRM backed by PostgreSQL (including Supabase PostgreSQL). Visitors can submit inquiries; administrators can sign in, search and filter the inbox, inspect inquiry details, and update statuses. -->

## Stack

- Frontend: React, Vite, React Router, Axios
- Backend: Node.js, Express, PostgreSQL (`pg`), BCrypt, and signed JWTs
- Database: PostgreSQL, accessed by the backend through `DATABASE_URL`

## Run locally

### Requirements

- Node.js 20 or newer and npm
- A PostgreSQL database. For Supabase, use the connection URI from **Project → Connect**. Use the session pooler URI if your network requires IPv4.

### 1. Create the database schema

Run [`schema.sql`](schema.sql) in the database SQL editor. It creates the `admins` and `inquiries` tables, indexes, and database access protections. It also copies existing rows from an older `users` table into `admins` without overwriting existing admins.

### 2. Configure the backend

Copy `backend/.env.example` to `backend/.env`, then set the values for your environment:

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

`DATABASE_URL` is the PostgreSQL connection URI; URL-encode reserved characters in its password. Do not use a Supabase service-role key. Generate a random JWT secret (PowerShell example):

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

`JWT_SECRET` must contain at least 32 bytes. `JWT_EXPIRATION_MS` defaults to `3600000` (one hour) and must be at least `60000` (one minute). The three `ADMIN_BOOTSTRAP_*` values are optional, but must either all be set or all be blank. On startup, the backend creates the administrator only if that email does not already exist; it will not reset an existing password. After the first account is created, remove the bootstrap values from `.env`.

### 3. Configure the frontend

Copy `frontend/.env.example` to `frontend/.env` and set:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8081/api
```

The backend CORS origin must match the browser's frontend origin (normally `http://localhost:5173`). Do not put `DATABASE_URL`, `JWT_SECRET`, or other server secrets in frontend environment variables; Vite variables are exposed to the browser.

### 4. Install and start

From the repository root:

```sh
npm install
npm run dev
```

This starts the API and Vite frontend together. Open the frontend URL printed by Vite (normally `http://localhost:5173`). The public inquiry form is at `/`; administrator login is at `/admin/login`. Press `Ctrl+C` once to stop both processes. The API listens on port `8081` by default. Startup retries database/API errors with a capped delay, and Vite is restarted if it stops.

## Test custom JWT authentication

JWT authentication is implemented by this Express backend; Supabase Auth is not used. The login route checks the administrator password against its BCrypt hash and returns a signed HS256 JWT. Protected routes require that token in the `Authorization` header. Tokens expire after `JWT_EXPIRATION_MS`.

With the backend running and an administrator created, log in using the bootstrap email and password (or credentials for an existing admin):

```sh
curl -i -X POST http://127.0.0.1:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"<strong-password>"}'
```

A successful response has status `200` and JSON shaped like `{"token":"...","expiresInMs":3600000,"admin":{"id":1,"name":"Local Admin","email":"admin@example.com"}}`. Copy the token value for the checks below.

Use the token on a protected route (PowerShell syntax):

```powershell
$token = '<paste-token-here>'
curl.exe -i http://127.0.0.1:8081/api/auth/me -H "Authorization: Bearer $token"
```

This should return `200` and the authenticated admin object. The same token can access admin data, for example:

```powershell
curl.exe -i http://127.0.0.1:8081/api/admin/inquiries -H "Authorization: Bearer $token"
```

Verify rejection behavior: calling a protected endpoint without the header should return `401` with `Authentication required.`; sending a malformed, altered, or expired token should return `401` with `Invalid or expired token.`. Wrong email/password at login returns `401`. For a quick expiry check in a local environment, set `JWT_EXPIRATION_MS=60000`, restart the backend, log in again, wait at least one minute, then repeat the `/api/auth/me` request and confirm it returns `401`.

The frontend login at `/admin/login` exercises the same flow: it stores the returned token in browser local storage and sends it as a bearer token for protected requests. Signing out clears that stored token.

## API

All endpoints return JSON. The API base is `/api`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/inquiries` | Public | Validate and save an inquiry |
| `POST` | `/auth/login` | Public | Verify admin password and return a signed JWT |
| `GET` | `/auth/me` | Admin JWT | Validate the current token and return the authenticated admin |
| `GET` | `/admin/inquiries` | Admin JWT | List inquiries; accepts `category`, `userType`, `search`, `page`, and `size` query parameters |
| `GET` | `/admin/inquiries/:id` | Admin JWT | Get inquiry details |
| `PATCH` | `/admin/inquiries/:id/status` | Admin JWT | Update status to `NEW`, `IN_PROGRESS`, or `RESOLVED` |
| `GET` | `/admin/inquiries/dashboard/stats` | Admin JWT | Get total and per-status counts |

Admin endpoints require `Authorization: Bearer <token>`. Passwords are stored as BCrypt hashes.

## Environment variable reference

| Variable | Used by | Description |
|---|---|---|
| `DATABASE_URL` | Backend | PostgreSQL connection URI |
| `JWT_SECRET` | Backend | Private signing key; at least 32 bytes |
| `JWT_EXPIRATION_MS` | Backend | Token lifetime in milliseconds; defaults to `3600000`, minimum `60000` |
| `PORT` | Backend | API listening port; defaults to `8081` |
| `APP_CORS_ALLOWED_ORIGIN` | Backend | Allowed frontend origin(s), comma-separated; local localhost/127.0.0.1 origins are allowed in development |
| `ADMIN_BOOTSTRAP_NAME` | Backend | Optional initial admin name; set together with email and password |
| `ADMIN_BOOTSTRAP_EMAIL` | Backend | Optional initial admin email |
| `ADMIN_BOOTSTRAP_PASSWORD` | Backend | Optional initial admin password; stored as a BCrypt hash |
| `VITE_API_BASE_URL` | Frontend | Backend API root, such as `http://127.0.0.1:8081/api` |

Environment templates: [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example). Keep real `.env` files and server credentials out of source control.

## Build and deployment

Build the frontend with `npm run build --prefix frontend`. Start the API with `npm start --prefix backend`. For deployment, configure backend secrets in the hosting provider, set the exact frontend origin for CORS, set `VITE_API_BASE_URL` before building the frontend, and serve both apps over HTTPS. A public repository URL and live demo are not configured in this workspace yet.
