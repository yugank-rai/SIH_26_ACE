from collections import defaultdict
from ortools.sat.python import cp_model
from app.scoring import compute_score


def solve(tasks: list[dict], available_slots: list[dict], horizon: str) -> dict:
    """
    Solves optimal assignment of railway maintenance tasks to available corridor slots using Google OR-Tools CP-SAT.

    tasks: [{"id": int, "corridor_id": str, "severity": int, "overdue_days": int, "defect_type": str}]
    available_slots: [{"id": int, "corridor_id": str, "start_time": str, "end_time": str}]
    horizon: "weekly" or "monthly"

    Returns: {
        "schedule": [{"task_id": int, "slot_id": int, "score": float}],
        "unscheduled": [{"task_id": int, "reason_code": str, "score": float}]
    }
    """
    if not tasks:
        return {"schedule": [], "unscheduled": []}

    # Step 1: Compute score for each task
    task_scores = {t["id"]: compute_score(t) for t in tasks}

    # Map available slots by corridor for quick reference and reason code determination
    corridor_slots = defaultdict(list)
    for slot in available_slots:
        corridor_slots[slot["corridor_id"]].append(slot)

    if not available_slots:
        unscheduled = [
            {
                "task_id": t["id"],
                "reason_code": "NO_CORRIDOR_SLOT",
                "score": task_scores[t["id"]],
            }
            for t in tasks
        ]
        return {"schedule": [], "unscheduled": unscheduled}

    # Step 2: Build CP-SAT model
    model = cp_model.CpModel()

    # Boolean variables x[task_id, slot_id] for valid corridor matches only
    x = {}
    task_vars = defaultdict(list)
    slot_vars = defaultdict(list)

    for t in tasks:
        t_id = t["id"]
        t_corridor = t["corridor_id"]
        for s in corridor_slots.get(t_corridor, []):
            s_id = s["id"]
            var = model.NewBoolVar(f"x_task_{t_id}_slot_{s_id}")
            x[(t_id, s_id)] = var
            task_vars[t_id].append(var)
            slot_vars[s_id].append(var)

    # Constraint: for each task, at most one slot assigned
    for t_id, vars_list in task_vars.items():
        model.Add(sum(vars_list) <= 1)

    # Constraint: for each slot, at most one task assigned (no double-booking)
    for s_id, vars_list in slot_vars.items():
        model.Add(sum(vars_list) <= 1)

    # Objective: maximize total weighted score across assigned tasks
    # CP-SAT requires integer coefficients, so multiply score by 10000
    objective_terms = [
        int(round(task_scores[t_id] * 10000)) * var
        for (t_id, s_id), var in x.items()
    ]
    if objective_terms:
        model.Maximize(sum(objective_terms))

    # Step 3: Solve with CP-SAT solver
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0
    status = solver.Solve(model)

    schedule = []
    scheduled_task_ids = set()

    # Step 4: Build schedule list
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for (t_id, s_id), var in x.items():
            if solver.Value(var) == 1:
                schedule.append({
                    "task_id": t_id,
                    "slot_id": s_id,
                    "score": task_scores[t_id],
                })
                scheduled_task_ids.add(t_id)

    # Step 5: Build unscheduled list with appropriate reason codes
    unscheduled = []
    for t in tasks:
        t_id = t["id"]
        if t_id not in scheduled_task_ids:
            corridor = t["corridor_id"]
            slots_for_corridor = corridor_slots.get(corridor, [])

            if len(slots_for_corridor) == 0:
                reason_code = "NO_CORRIDOR_SLOT"
            else:
                # Valid slots existed for this corridor, but were awarded to higher/equal scoring tasks
                reason_code = "LOWER_PRIORITY"

            unscheduled.append({
                "task_id": t_id,
                "reason_code": reason_code,
                "score": task_scores[t_id],
            })

    # Step 6: Return formatted schedule and unscheduled lists
    return {
        "schedule": schedule,
        "unscheduled": unscheduled,
    }
