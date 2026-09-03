# RailAID — AI-Assisted Railway Maintenance Scheduling & Slot Optimizer

[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
[![Node](https://img.shields.io/badge/Node.js-20_LTS-339933?logo=nodedotjs&logoColor=white)](backend/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](frontend/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](optimizer/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](optimizer/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](frontend/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwindcss&logoColor=white)](frontend/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_Alpine-4169E1?logo=postgresql&logoColor=white)](backend/src/db/)
[![OR-Tools](https://img.shields.io/badge/Google_OR--Tools-CP--SAT-EA4335?logo=google&logoColor=white)](optimizer/app/solver.py)

**RailAID** is an enterprise-grade railway operations platform designed to solve the critical conflict between high-density train traffic (passenger and freight) and essential infrastructure maintenance across Indian Railways corridors. 

Powered by **Google OR-Tools CP-SAT (Constraint Programming)**, RailAID optimizes corridor block allocations, coordinates cross-department maintenance (Engineering, S&T, and Traction Distribution), prevents double-bookings, and maximizes network uptime across weekly and monthly planning horizons.

---

## 🏗️ System Architecture

```
                                  ┌───────────────────────────────┐
                                  │      React 18 + Vite UI       │
                                  │  (Dashboard, Planner, Assets) │
                                  └───────────────┬───────────────┘
                                                  │ HTTP (REST)
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │   Node.js / Express Backend   │
                                  │       (Drizzle ORM)           │
                                  └───────┬───────────────┬───────┘
                                          │               │
                      ┌───────────────────┘               └───────────────────┐
                      ▼                                                       ▼
        ┌───────────────────────────┐                           ┌───────────────────────────┐
        │       PostgreSQL 16       │                           │ Python FastAPI Optimizer  │
        │ 7 Tables: Defects, Slots, │                           │  (Google OR-Tools CP-SAT) │
        │ Timetables, Metrics, etc. │                           │  Scoring + Solver Engine  │
        └───────────────────────────┘                           └───────────────────────────┘
```

---

## 📁 Monorepo Structure

```
railaid/
├── frontend/                  # React + Vite + TypeScript + Tailwind CSS + React Query
│   ├── src/
│   │   ├── components/        # Sidebar, Header, Badge, Toast, NewDefectModal
│   │   ├── screens/           # DashboardScreen, PlannerScreen, AssetsScreen, CorridorsScreen
│   │   ├── lib/api.ts         # Type-safe API client and Toast event bus
│   │   └── types/             # Shared TypeScript entity interfaces
│   └── package.json
│
├── backend/                   # Node.js + Express + TypeScript + Drizzle ORM
│   ├── src/
│   │   ├── db/                # Drizzle schema (7 tables) & deterministic seed script
│   │   ├── routes/            # /api/defects, /api/timetable, /api/goods-forecast, /api/schedule, /api/metrics
│   │   ├── services/          # Availability engine (designated block days & overlap filtering)
│   │   └── index.ts           # Express server & global CORS configuration
│   ├── Dockerfile             # Multi-stage container build
│   └── package.json
│
├── optimizer/                 # Python 3.11 + FastAPI microservice (Standalone)
│   ├── app/
│   │   ├── scoring.py         # Multi-factor defect prioritization (Severity 40%, Overdue 35%, Safety 25%)
│   │   ├── solver.py          # Google OR-Tools CP-SAT constraint optimization engine
│   │   ├── baseline.py        # Naive uncoordinated FIFO scheduler for conflict benchmarking
│   │   ├── metrics.py         # KPIs: Uptime %, downtime hours saved, conflicts resolved
│   │   └── main.py            # FastAPI endpoints (POST /optimize, GET /health)
│   ├── Dockerfile             # Python slim container
│   └── requirements.txt
│
├── docs/
│   ├── contract.md            # Field-level JSON schema contract between Backend & Optimizer
│   └── architecture.md        # Comprehensive data flows and mathematical formulations
│
├── docker-compose.yml         # Container orchestration for Postgres, Backend, and Optimizer
└── README.md
```

---

## ✨ Key Features & Screens

### 1. Operations Dashboard (`/`)
- **Real-Time KPIs**: Weekly network uptime %, scheduled maintenance blocks, count of critical severity-5 defects, and deferred backlog.
- **Multi-Horizon Capacity Scaling**: Side-by-side Recharts bar comparison illustrating capacity gains (+45.5 pts) when moving from weekly (40.9%) to monthly (86.4%) planning.
- **Critical Backlog Quick-Glance**: Instant view of the 5 highest-risk open defects across all corridors.

### 2. AI Corridor Slot Planner (`/planner`) — *Centerpiece Screen*
- **Constraint-Based Optimization**: One-click triggering of the OR-Tools CP-SAT engine via `POST /api/schedule/generate`.
- **Horizon Switcher**: Switch seamlessly between **Weekly (7-day)** and **Monthly (30-day)** planning horizons.
- **Allocated Schedule View**: Filterable schedule table grouped by corridor with assigned timestamps (`00:00 - 02:00`), department badges, and composite scores.
- **Deferred Backlog with Reason Codes**: Human-readable explanations for unscheduled tasks (`LOWER_PRIORITY`, `NO_CORRIDOR_SLOT`, `CAPACITY_EXCEEDED`).
- **AI Insights**: Dynamic analytics summarizing throughput, highest-priority deferred tasks, and double-booking conflicts avoided vs. manual scheduling.

### 3. Maintenance Asset Backlog (`/assets`)
- **Cross-Department Defect Inventory**: Tracks 22+ active infrastructure issues across **Engineering** (Track/Civil), **S&T** (Signals & Telecom), and **Traction Distribution** (TRD/OHE).
- **Multi-Level Filtering & Search**: Department filter tabs, real-time keyword search, and severity badge indicators.
- **Asset Detail Inspector**: Right-hand panel displaying complete technical specifications and safety ratings.
- **Live Defect Logging**: Modal form with strict validation (`POST /api/defects`) enabling real-time injection of new defects during demonstrations.

### 4. Corridor Traffic & Block Monitor (`/corridors`)
- **Corridor Route Selector**: Deep-dive into 5 critical routes:
  - `NDLS-PNP` (New Delhi – Panipat)
  - `NDLS-GZB` (New Delhi – Ghaziabad)
  - `NDLS-AGC` (New Delhi – Agra Cantt)
  - `NDLS-CNB` (New Delhi – Kanpur Central)
  - `NDLS-UMB` (New Delhi – Ambala Cantt)
- **7-Day Maintenance Matrix**: Visual indicator comparing designated low-traffic block windows against freight paths and passenger trains.
- **Traffic Visualizers**: Side-by-side inspection of passenger timetables (`GET /api/timetable`) and freight forecasts (`GET /api/goods-forecast`).

---

## ⚡ Quick Start (Local Setup)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Docker Compose v2+)
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/) (v10+)

---

### Step 1: Start Backend, Optimizer & PostgreSQL Services

Launch the containerized infrastructure with Docker Compose:

```bash
docker-compose up --build -d
```

Verify that all 3 services are running:
```bash
docker-compose ps
```

| Service | Port | Endpoint URL | Description |
| :--- | :--- | :--- | :--- |
| **PostgreSQL 16** | `5432` | `localhost:5432` | Relational database (`railaid`) |
| **Backend API** | `5000` | `http://localhost:5000/api` | Express + Drizzle REST API |
| **Optimizer Engine** | `8000` | `http://localhost:8000` | FastAPI + OR-Tools microservice |

---

### Step 2: Seed the Database

Populate PostgreSQL with initial departments, 22 realistic defects, passenger train timetables, and conflicting goods freight forecasts:

```bash
docker-compose exec backend npm run seed
```

---

### Step 3: Run the React Frontend

The frontend runs locally outside Docker for instant hot-module reloading:

```bash
cd frontend
npm install
npm run dev
```

Open your browser at **`http://localhost:5173`** (or `http://localhost:5174`).

---

## 🔌 API Reference

### 1. Defects API
- `GET /api/defects` — Retrieve all open defects joined with department names.
- `POST /api/defects` — Log a new defect.
  ```json
  {
    "corridor_id": "NDLS-PNP",
    "dept_id": 1,
    "asset_id": "TRK-NDLS-PNP-044",
    "defect_type": "Ultrasonic flaw detected on rail weld joint",
    "severity": 5,
    "overdue_days": 14
  }
  ```

### 2. Corridor Traffic API
- `GET /api/timetable` — Returns scheduled passenger train runs.
- `GET /api/goods-forecast` — Returns freight rake traffic windows and priority levels.

### 3. AI Optimization & Schedule API
- `POST /api/schedule/generate` — Computes non-overlapping slots and triggers OR-Tools CP-SAT solver.
  ```json
  { "horizon": "weekly" }
  ```
- `GET /api/schedule?horizon=weekly|monthly` — Retrieves latest persisted schedule and backlog.
- `GET /api/metrics?horizon=weekly|monthly` — Retrieves optimization KPIs (uptime %, downtime saved, conflicts resolved).

### 4. Optimizer Microservice (FastAPI)
- `POST /optimize` — Pure algorithmic optimization endpoint (JSON in $\rightarrow$ JSON out).
- `GET /health` — Service health check.
- `GET /docs` — Interactive OpenAPI Swagger UI at `http://localhost:8000/docs`.

---

## 🧠 Optimization & Mathematical Formulation

### 1. Priority Scoring Function
Every defect $t$ is scored based on three weighted operational criteria:

$$\text{Score}(t) = 0.40 \cdot \left(\frac{\text{Severity}_t}{5.0}\right) + 0.35 \cdot \min\left(\frac{\text{Overdue Days}_t}{30}, 1.0\right) + 0.25 \cdot \text{Safety Factor}(\text{Defect Type}_t)$$

Where **Safety Factor** is categorized by risk keywords:
- **High Risk (1.00)**: Track fracture, rail flaw, weld defect, OHE contact wire sag, circuit breaker tripping.
- **Medium Risk (0.65)**: Signal relay resistance, point machine backlash, insulator tracking.
- **Routine Risk (0.30)**: Structure bonding, routine cosmetic inspection.

### 2. Constraint Programming Model (CP-SAT)
Let $x_{t, s} \in \{0, 1\}$ be the binary decision variable indicating whether task $t$ is scheduled in slot $s$:

$$\max \sum_{t \in T} \sum_{s \in S} \text{Score}(t) \cdot x_{t, s}$$

**Subject to:**
1. **Task Uniqueness**: $\sum_{s \in S} x_{t, s} \le 1 \quad \forall t \in T$ (A task is scheduled at most once).
2. **Slot Capacity**: $\sum_{t \in T} x_{t, s} \le 1 \quad \forall s \in S$ (A 2-hour maintenance window holds at most one task).
3. **Corridor Compatibility**: $x_{t, s} = 0 \quad \text{if } \text{Corridor}(t) \neq \text{Corridor}(s)$ (Tasks can only be assigned to slots on their respective corridor).
4. **Traffic Window Exclusions**: Candidate slots overlapping passenger trains or freight paths are pruned prior to solver dispatch.

---

## 🧪 Verification & Testing

### Test Optimizer Standalone:
```bash
curl -X POST http://localhost:8000/optimize -H "Content-Type: application/json" -d @test-request.json
```

### Test Schedule Generation (Weekly):
```bash
curl -X POST http://localhost:5000/api/schedule/generate -H "Content-Type: application/json" -d '{"horizon":"weekly"}'
```

### Test Schedule Generation (Monthly):
```bash
curl -X POST http://localhost:5000/api/schedule/generate -H "Content-Type: application/json" -d '{"horizon":"monthly"}'
```

### Frontend Type Check & Production Build:
```bash
cd frontend
npm run build
```

---

## 👥 Team & License

Built for the **Smart India Hackathon (SIH 2026)** — Problem Statement: Intelligent Railway Maintenance & Corridor Slot Scheduling.
Distributed under the MIT License.
