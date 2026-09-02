from collections import defaultdict


def naive_baseline(tasks: list[dict], available_slots: list[dict]) -> dict:
    """
    Simulates unintelligent manual scheduling: sort tasks by overdue_days DESCENDING only 
    (ignore severity, ignore defect_type, ignore department coordination). Assign each task, 
    in that order, to the FIRST available slot matching its corridor_id (first-come-first-served), 
    without checking if that slot is already taken by an earlier assignment in THIS baseline run 
    — i.e., deliberately allow double-booking to simulate uncoordinated manual planning.

    Returns: {
        "conflicts": [{"corridor_id": str, "slot_id": int, "task_ids": [int, int]}],
        "conflict_count": int
    }

    A conflict = two or more tasks assigned to the same slot_id in this naive baseline.
    Group assignments by slot_id, any slot_id with more than one task assigned to it is a conflict.
    """
    if not tasks or not available_slots:
        return {"conflicts": [], "conflict_count": 0}

    # Map first available slot per corridor
    first_slot_by_corridor = {}
    slot_corridor_map = {}
    for slot in available_slots:
        s_id = slot["id"]
        c_id = slot["corridor_id"]
        slot_corridor_map[s_id] = c_id
        if c_id not in first_slot_by_corridor:
            first_slot_by_corridor[c_id] = s_id

    # Sort tasks by overdue_days descending only
    sorted_tasks = sorted(tasks, key=lambda t: t.get("overdue_days", 0), reverse=True)

    # Assign each task to the first available matching corridor slot
    slot_assignments = defaultdict(list)
    for t in sorted_tasks:
        c_id = t.get("corridor_id")
        if c_id in first_slot_by_corridor:
            s_id = first_slot_by_corridor[c_id]
            slot_assignments[s_id].append(t["id"])

    # Group assignments by slot_id; any slot with >1 task is a conflict
    conflicts = []
    for s_id, task_ids in slot_assignments.items():
        if len(task_ids) > 1:
            conflicts.append({
                "corridor_id": slot_corridor_map.get(s_id, ""),
                "slot_id": s_id,
                "task_ids": task_ids,
            })

    return {
        "conflicts": conflicts,
        "conflict_count": len(conflicts),
    }
