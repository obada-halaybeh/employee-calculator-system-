# Employee Salary Calculator Backend

Express + MySQL backend for the Employee Salary Calculator System.

## Setup
1. `cd server`
2. Copy `.env.example` to `.env` and fill DB credentials.
3. `npm install`
4. Optional seed admin: `npm run seed`
5. Start dev server: `npm run dev` (or `npm start`)

## Endpoints
- `POST /api/auth/login`
- Admin (JWT + role=Admin): `/api/admin/users` CRUD/status.
- HR (JWT + role=HRStaff): employees, salary details, pay periods, payslips generation/list, advance approvals, reports (custom, export).
- Employee (JWT + role=Employee): profile, payslips, advance requests.

Health check: `GET /health`.
