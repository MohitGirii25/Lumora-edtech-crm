# Brightpath EdTech CRM

A React and Express inquiry CRM backed by Supabase PostgreSQL. Visitors can submit inquiries; administrators can sign in, search and filter the inbox, inspect inquiry details, and update statuses.

## Stack

- Frontend: React, Vite, React Router, Axios
- Backend: Node.js, Express, PostgreSQL (`pg`), BCrypt, and signed JWTs
- Database: Supabase PostgreSQL, accessed by the backend through `DATABASE_URL`

## Run locally

Requirements: Node.js 20 or newer, npm, and a Supabase PostgreSQL project (or PostgreSQL for local development).

1. In Supabase, open **Connect** and copy the PostgreSQL connection URI. Use the session pooler URI if your network needs IPv4.
2. Run `schema.sql` in the Supabase SQL Editor. This creates the `admins` and `inquiries` tables, indexes, and database access protections. It also copies existing rows from an older `users` table into `admins` without overwriting existing admins.
3. Copy `backend/.env.example` to `backend/.env`. Set `DATABASE_URL`, a unique random `JWT_SECRET` of at least 32 bytes, and the frontend origin. URL-encode reserved characters in the database password. Do not use a Supabase service-role key.
4. Set `ADMIN_BOOTSTRAP_NAME`, `ADMIN_BOOTSTRAP_EMAIL`, and `ADMIN_BOOTSTRAP_PASSWORD` in `backend/.env` to create the first administrator. All three must be set together. Remove the bootstrap values after the account is created; startup will not reset or replace an existing account.
5. Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL` to the backend API root, such as `http://127.0.0.1:8081/api`.
6. From the repository root, run `npm install`, then `npm run dev`. This starts the API and frontend together in the same terminal. Database or port startup errors are retried with a capped delay, and Vite restarts if it stops. Press `Ctrl+C` once to stop both.
7. Open the Vite URL shown in the terminal (normally `http://localhost:5173`). The inquiry form is at `/`; admin login is at `/admin/login`.

The backend listens on port `8081` by default. Configure `APP_CORS_ALLOWED_ORIGIN` to exactly match the frontend origin. The backend connects to Postgres directly; public browser users cannot access the database tables through the Supabase Data API.

## API

All endpoints return JSON. The API base is `/api`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/inquiries` | Public | Validate and save an inquiry |
| `POST` | `/auth/login` | Public | Verify admin password and return a signed JWT |
| `GET` | `/auth/me` | Admin JWT | Validate the current token before rendering the protected dashboard |
| `GET` | `/admin/inquiries` | Admin JWT | List inquiries; accepts `category`, `userType`, `search`, `page`, and `size` query parameters |
| `GET` | `/admin/inquiries/:id` | Admin JWT | Get inquiry details |
| `PATCH` | `/admin/inquiries/:id/status` | Admin JWT | Update status to `NEW`, `IN_PROGRESS`, or `RESOLVED` |
| `GET` | `/admin/inquiries/dashboard/stats` | Admin JWT | Get total and per-status counts |

Admin endpoints require `Authorization: Bearer <token>`. Passwords are stored as BCrypt hashes. JWT authentication is implemented in this backend; Supabase Auth is not used.

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for templates. Backend variables are `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRATION_MS`, `PORT`, `APP_CORS_ALLOWED_ORIGIN`, and the three optional first-admin bootstrap variables. The frontend uses `VITE_API_BASE_URL`. Never put database credentials or JWT secrets in frontend variables.

## Build and deployment

Build the frontend with `npm run build --prefix frontend`. Start the API with `npm start --prefix backend`. For deployment, configure the backend secrets in the hosting provider, set the exact frontend origin for CORS, set `VITE_API_BASE_URL` before building the frontend, and serve both apps over HTTPS. A public repository URL and live demo are not configured in this workspace yet.
