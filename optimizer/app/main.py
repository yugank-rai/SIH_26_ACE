from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.solver import solve
from app.baseline import naive_baseline
from app.metrics import compute_metrics

app = FastAPI(
    title="RailAID Optimizer Service",
    description="Microservice for AI-assisted railway maintenance slot and schedule optimization",
    version="1.0.0",
)

# Enable CORS for local development and backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request & Response Schemas ---

class TaskItem(BaseModel):
    id: int
    corridor_id: str
    severity: int = Field(ge=1, le=5)
    overdue_days: int = Field(ge=0)
    defect_type: str


class AvailableSlotItem(BaseModel):
    id: int
    corridor_id: str
    start_time: str
    end_time: str


class OptimizeRequest(BaseModel):
    tasks: List[TaskItem] = []
    available_slots: List[AvailableSlotItem] = []
    horizon: str = "weekly"


class ScheduledItem(BaseModel):
    task_id: int
    slot_id: int
    score: float


class UnscheduledItem(BaseModel):
    task_id: int
    reason_code: str
    score: float


class MetricsOutput(BaseModel):
    uptime_pct: float
    downtime_hours_saved: float
    conflicts_resolved: int


class OptimizeResponse(BaseModel):
    schedule: List[ScheduledItem]
    unscheduled: List[UnscheduledItem]
    metrics: MetricsOutput


# --- Endpoints ---

@app.get("/")
def root():
    return {"status": "ok", "service": "railaid-optimizer"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/optimize", response_model=OptimizeResponse)
def optimize(request: OptimizeRequest):
    """
    Optimizes railway maintenance schedule:
    1. Evaluates defect multi-criteria priority scores.
    2. Runs CP-SAT solver for conflict-free corridor slot allocation.
    3. Simulates naive uncoordinated baseline to measure conflicts resolved.
    4. Computes uptime percentage and downtime hours saved.
    """
    tasks_data = [t.model_dump() for t in request.tasks]
    slots_data = [s.model_dump() for s in request.available_slots]

    # Handle empty cases gracefully
    if not tasks_data or not slots_data:
        # If tasks exist but no slots, solve will produce all unscheduled with NO_CORRIDOR_SLOT
        solve_result = solve(tasks_data, slots_data, request.horizon)
        baseline_result = naive_baseline(tasks_data, slots_data)
        metrics = compute_metrics(
            schedule=solve_result["schedule"],
            unscheduled=solve_result["unscheduled"],
            tasks=tasks_data,
            available_slots=slots_data,
            baseline_result=baseline_result,
        )
        return {
            "schedule": solve_result["schedule"],
            "unscheduled": solve_result["unscheduled"],
            "metrics": metrics,
        }

    # Execute CP-SAT optimization solver
    solve_result = solve(tasks_data, slots_data, request.horizon)

    # Compute baseline for conflict comparison
    baseline_result = naive_baseline(tasks_data, slots_data)

    # Compute performance metrics
    metrics = compute_metrics(
        schedule=solve_result["schedule"],
        unscheduled=solve_result["unscheduled"],
        tasks=tasks_data,
        available_slots=slots_data,
        baseline_result=baseline_result,
    )

    return {
        "schedule": solve_result["schedule"],
        "unscheduled": solve_result["unscheduled"],
        "metrics": metrics,
    }
