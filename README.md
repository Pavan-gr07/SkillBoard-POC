# SkillBridge — Attendance Management System

A full-stack MERN attendance management system for a state-level skilling programme with five distinct user roles.

---

## Live URLs

| Service  | URL                              |
|----------|----------------------------------|
| Frontend | `https://main.d21q41489vwpur.amplifyapp.com/` _(Deployed In AWS Amplify)|
| Backend  | `https://kylzor0qo9.execute-api.ap-south-1.amazonaws.com/dev/` _(Deployed In AWS Lamda)_ |
| API Base | `https://kylzor0qo9.execute-api.ap-south-1.amazonaws.com/dev/api` |

---

## Test Accounts

Create these accounts via the `/signup` page after deploying (or use the seed script below).

| Role               | Email                        | Password   |
|--------------------|------------------------------|------------|
| Student            | student@test.com             | test123    |
| Trainer            | trainer@test.com             | test123    |
| Institution        | institution@test.com         | test123    |
| Programme Manager  | manager@test.com             | test123    |
| Monitoring Officer | officer@test.com             | test123    |

> The Institution account will prompt you for an institution name on signup (e.g. "NSDC Training Centre").

---

## Local Setup

### Prerequisites
- Node.js v18+
- A MongoDB Atlas account (free tier works)
- Git

### 1. Clone and install

```bash
git clone https://github.com/Pavan-gr07/SkillBoard-POC.git
cd skillbridge

# Backend
cd backend
npm install
cp .env
# Edit .env: set MONGO_URI and JWT_SECRET

# Frontend
cd ../frontend
npm install
cp .env.example .env
# Edit .env: set VITE_API_URL=http://localhost:5000/api
```

### 2. Run locally

```bash
# Terminal 1 — Backend
cd backend
npm run dev        # Runs on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev        # Runs on http://localhost:5173
```

### 3. (Optional) Seed test data

After creating test accounts via the UI, note the Institution ID shown in the MongoDB Atlas dashboard or from the signup response, and use it when creating batches/assigning trainers.

---

## Stack Choices

| Layer     | Choice       | Why |
|-----------|--------------|-----|
| Frontend  | React + Vite | Fast dev server, modern JSX, no extra config overhead |
| Backend   | Express.js   | Minimal, flexible, wide ecosystem — ideal for REST APIs |
| Database  | MongoDB Atlas| Schema-flexible, generous free tier, hosted |
| Auth      | JWT (custom) | No third-party dependency, full control, works anywhere |
| Styling   | Plain CSS    | No build-time overhead, full control, faster iteration |
| Deploy FE | AWS Amplify  | Zero-config Vite deploys, free tier |
| Deploy BE | AWS Lamda    | Simple Node.js hosting, free tier, env var management,Serverless |

**Why not Clerk?** Chose custom JWT to avoid vendor lock-in and keep the backend self-contained. The tradeoff is we manage password hashing (bcryptjs) and token refresh ourselves — acceptable for a prototype.

---

## Schema Design Decisions

### Users + Roles in one collection
All five roles live in a single `users` collection with a `role` enum field. This keeps auth simple — one login flow, one token, one middleware check. The alternative (separate collections per role) would complicate joins significantly.

### institution_id on User
Trainers and students carry an `institution_id` reference directly on their user document. This allows fast "who belongs to this institution?" queries without an extra join table.

### Batch with embedded arrays
`batches.trainers[]` and `batches.students[]` store ObjectId arrays. For a prototype with hundreds of students per batch (not tens of thousands), this is simpler than a junction collection and avoids extra queries. At scale, a `batch_members` collection would be cleaner.

### Invite tokens on Batch
Rather than a separate `invites` collection, the invite token is a field on the batch itself (`nanoid(12)`). This keeps the join flow simple: student POSTs `/batches/:id/join` with the token, we verify it matches, add them. A separate collection would be needed if tokens needed expiry or per-use tracking.

### Attendance uniqueness index
`{ session_id, student_id }` compound unique index prevents double-marking. The API also checks for duplicates before insert and returns a 409, giving the frontend a clean message.

---

## What's Working

- ✅ All 5 roles: signup, login, JWT auth, role-based routing
- ✅ Trainer: create sessions, view attendance per session, generate batch invite links
- ✅ Student: view sessions, mark attendance (today's sessions only), view history
- ✅ Institution: view batches, per-batch attendance summary, assign trainers by email
- ✅ Programme Manager: programme-wide summary, per-institution breakdown
- ✅ Monitoring Officer: read-only dashboard, no create/edit/delete UI anywhere
- ✅ Backend role checks on every protected endpoint (returns 403 on mismatch)
- ✅ Batch invite link flow: trainer generates → student visits URL → auto-joined

## What's Partially Done

- ⚠️ Students can only mark attendance for today's sessions. A "late" status can be sent via API but the UI defaults to "present". 
- ⚠️ Trainer batch creation requires institution_id to be typed manually if the trainer wasn't assigned to an institution at signup — a dropdown from the API would be cleaner.

## What's Skipped

- ❌ Email verification / password reset flow
- ❌ Pagination on any list endpoint (fine for prototype scale)
- ❌ Session editing / deletion
- ❌ Programme Manager ability to view per-institution detailed batch drill-down (only top-level summary)
- ❌ Refresh tokens (current JWTs last 7 days, then re-login required)

---

## What I'd Do Differently With More Time

Add **optimistic UI updates** throughout. Currently every mutation (mark attendance, create session) waits for the API round-trip before updating the list. With React Query or SWR, I'd cache responses and update the UI immediately with a rollback on error — this makes the product feel significantly faster without changing the backend at all.

---

## Deployment Guide

### Backend on Lamda
1. Push `backend/` to a GitHub repo
2. New project → Deploy from GitHub → select repo
3. Add env vars: `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`, `PORT=5000`
4. Lamda using .yml commands `serverless deploy`

### Frontend on Amplify
1. Push `frontend/` to a GitHub repo  
2. Import project on Aws Amplify 
3. Add env var: `VITE_API_URL=https://kylzor0qo9.execute-api.ap-south-1.amazonaws.com/dev/api`
4. Deploy

### MongoDB Atlas
1. Create free M0 cluster
2. Create DB user, whitelist `0.0.0.0/0` for AWS's dynamic IPs
3. Copy connection string to `MONGO_URI` env var

---

## API Reference (Key Endpoints)

```
POST   /api/auth/signup              Register (any role)
POST   /api/auth/login               Login → JWT
GET    /api/auth/me                  Get current user

POST   /api/batches                  Create batch (trainer/institution)
POST   /api/batches/:id/invite       Generate invite link (trainer)
POST   /api/batches/:id/join         Join via token (student)
GET    /api/batches                  List batches (role-filtered)
GET    /api/batches/:id/summary      Attendance summary (institution+)

POST   /api/sessions                 Create session (trainer)
GET    /api/sessions                 List sessions (role-filtered)
GET    /api/sessions/:id/attendance  Full attendance for session (trainer+)

POST   /api/attendance/mark          Mark own attendance (student)
GET    /api/attendance/my            Student's attendance history

GET    /api/institutions             List institutions (manager/officer)
GET    /api/institutions/:id/summary Per-institution breakdown
POST   /api/institutions/:id/trainers Assign trainer by email

GET    /api/programme/summary        Programme-wide stats (manager/officer)
```

All protected endpoints require `Authorization: Bearer <token>` header. Role mismatches return `403`.
