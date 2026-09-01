# RailAID — AI-Assisted Railway Maintenance Scheduling & Slot Optimizer

RailAID is an intelligent railway operations and maintenance platform engineered to resolve infrastructure defect backlogs, prevent corridor congestion, and optimize maintenance blocks across high-density Indian Railways routes.

---

## 📁 Monorepo Structure

```
railaid/
├── frontend/          # React + Vite + TypeScript + Tailwind CSS (App scaffold)
├── backend/           # Node.js + Express + TypeScript + Drizzle ORM
├── optimizer/         # Python + FastAPI optimization microservice
├── docs/
│   ├── contract.md    # JSON schema contract between Backend & Optimizer
│   └── architecture.md# System architecture and data flow documentation
├── docker-compose.yml # PostgreSQL 16 + Backend + Optimizer orchestration
└── README.md
```

---

## 🚀 Quick Start (Docker Compose)

### 1. Start Services

To launch the **PostgreSQL**, **Backend**, and **Optimizer** microservices together:

```bash
docker-compose up --build
```

| Service | Port | Description |
| :--- | :--- | :--- |
| **PostgreSQL 16** | `5432` | Relational database (`railaid`) |
| **Backend API** | `5000` | Node.js Express server |
| **Optimizer Engine**| `8000` | FastAPI optimization microservice |

---

## 🗄️ Database Management & Seeding

The database schema is defined with Drizzle ORM in `backend/src/db/schema.ts` across 7 tables:
1. `departments` (Engineering, S&T, Traction Distribution)
2. `defects` (22 realistic defects across 5 corridors, severities 1-5, overdue days 0-45)
3. `train_timetable` (12 passenger train timetables)
4. `goods_forecast` (6 freight forecasts with deliberate conflict overlaps)
5. `available_slots` (Populated by runtime computation)
6. `schedule_results` (Optimization outputs)
7. `run_metrics` (Optimization run KPIs)

### Push Schema & Seed Data

In the `backend` directory:

```bash
cd backend
npm install

# Push schema directly to Postgres
npm run db:push

# Execute deterministic seed script (safe to re-run)
npm run seed
```

---

## 🖥️ Running the Frontend

The frontend runs locally outside of Docker for fast hot-module reloading:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173` and communicate with the backend at `http://localhost:5000` via `.env.local` (`VITE_API_URL`).

---

## 🔌 API Endpoints (Initial Scaffold)

- **Backend**:
  - `GET http://localhost:5000/` — Service info
  - `GET http://localhost:5000/health` — Health check
- **Optimizer**:
  - `POST http://localhost:8000/optimize` — Optimization stub (returns `{"schedule": [], "unscheduled": [], "metrics": {}}`)
  - `GET http://localhost:8000/health` — Health check
  - `GET http://localhost:8000/docs` — Interactive OpenAPI Swagger documentation
