# RailAID Architecture Overview

RailAID is an AI-assisted railway maintenance scheduling and slot optimization platform designed to resolve maintenance backlogs, optimize corridor downtime, and eliminate conflicts with passenger timetables and freight traffic.

---

## 1. High-Level Architecture

```mermaid
graph TD
    User["Railway Maintenance Planner"] -->|UI Browser| Frontend["Frontend (React + Vite + Tailwind)<br/>Port 5173 / localhost"]
    Frontend -->|REST API Requests| Backend["Backend (Node.js + Express + Drizzle)<br/>Port 5000"]
    Backend -->|SQL Queries & Migrations| Postgres[("PostgreSQL 16 Database<br/>Port 5432 / railaid")]
    Backend -->|POST /optimize (Payload)| Optimizer["Optimizer Microservice (Python + FastAPI)<br/>Port 8000"]
    Optimizer -->|Schedule & Metrics Result| Backend
```

---

## 2. System Components

### 2.1 Frontend (`/frontend`)
- **Tech Stack**: React 18 / 19, TypeScript, Vite, Tailwind CSS.
- **Port**: Local dev server on port `5173`.
- **Role**: Dashboard for maintenance engineers and traffic controllers to inspect defect backlogs, visualize timetable slots, trigger optimization runs, and review scheduled maintenance blocks.
- **Environment**: Configured via `.env.local` with `VITE_API_URL=http://localhost:5000`.

### 2.2 Backend (`/backend`)
- **Tech Stack**: Node.js, Express, TypeScript, Drizzle ORM, PostgreSQL driver (`pg`).
- **Port**: `5000` (Dockerized & local runnable).
- **Role**:
  - Serves REST APIs to the frontend.
  - Manages corridor infrastructure, departments, defect logs, timetables, and available slots.
  - Interacts with PostgreSQL using Drizzle ORM.
  - Orchestrates calls to the Python Optimization service and persists schedule results and run metrics.
- **Environment**:
  - `DATABASE_URL`: `postgresql://postgres:postgres@postgres:5432/railaid`
  - `OPTIMIZER_URL`: `http://optimizer:8000`

### 2.3 Optimizer Microservice (`/optimizer`)
- **Tech Stack**: Python 3.11, FastAPI, Uvicorn.
- **Port**: `8000` (Dockerized).
- **Role**: Algorithmic optimization engine that ingests defects, corridor constraints, and available windows to compute optimal maintenance schedules, minimizing operational disruption and maximizing safety.

### 2.4 Database (`PostgreSQL 16`)
- **Port**: `5432`
- **Tables (7)**:
  1. `departments` - Department entities (Engineering, S&T, Traction Distribution).
  2. `defects` - Maintenance backlog with severity (1-5), overdue days, corridor and asset IDs.
  3. `train_timetable` - Scheduled passenger train corridor passages.
  4. `goods_forecast` - Predicted freight train windows and priority ratings.
  5. `available_slots` - Calculated maintenance opportunities (computed from raw corridor capacity minus timetable and freight windows).
  6. `schedule_results` - Output of optimization runs assigning defects to slots with score and reason codes.
  7. `run_metrics` - KPIs per optimization run (uptime %, downtime saved, conflicts resolved).

---

## 3. Data Flow & Optimization Lifecycle

1. **Defect Ingestion & Timetable Sync**:
   - Defect tickets from Engineering, S&T, and TRD are registered with severities and overdue timelines.
   - Fixed passenger timetables and dynamic goods forecasts are synced per corridor.
2. **Slot Derivation**:
   - Backend derives `available_slots` across weekly and monthly horizons.
3. **Optimization Execution**:
   - Backend constructs an optimization payload and invokes `POST http://optimizer:8000/optimize`.
4. **Persistence & Evaluation**:
   - Schedule results and run metrics are stored in `schedule_results` and `run_metrics`.
   - Planners review assignments, downtime saved, and conflict resolution metrics on the UI.
