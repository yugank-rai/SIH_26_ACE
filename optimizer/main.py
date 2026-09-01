from typing import Any, Dict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="RailAID Optimizer Service",
    description="Microservice for AI-assisted railway maintenance slot and schedule optimization",
    version="1.0.0",
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> Dict[str, str]:
    return {"status": "ok", "service": "railaid-optimizer"}


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {"status": "healthy"}


@app.post("/optimize")
def optimize(payload: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Optimization stub endpoint.
    Returns empty schedule, unscheduled list, and metrics dictionary.
    """
    return {
        "schedule": [],
        "unscheduled": [],
        "metrics": {}
    }
