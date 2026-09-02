def compute_metrics(
    schedule: list,
    unscheduled: list,
    tasks: list,
    available_slots: list,
    baseline_result: dict
) -> dict:
    """
    Computes optimization metrics including uptime percentage, downtime hours saved,
    and conflicts resolved compared against the naive baseline.

    Returns: {
        "uptime_pct": float,          # (scheduled task count / total task count) * 100, rounded to 1 decimal
        "downtime_hours_saved": float, # sum of overdue_days for all SCHEDULED tasks * 24, as a proxy 
                                        # for downtime hours addressed (simple, defensible estimate — 
                                        # document this assumption in a code comment)
        "conflicts_resolved": int      # baseline_result["conflict_count"]
    }
    """
    total_tasks = len(tasks)
    scheduled_tasks = len(schedule)

    # 1. Uptime / Completion percentage
    uptime_pct = round((scheduled_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

    # 2. Downtime hours saved calculation
    # Assumption: Each overdue day represents 24 hours of accumulated operational risk/downtime backlog.
    # Scheduling and executing the defect resolves this backlog.
    task_map = {t["id"]: t for t in tasks}
    total_overdue_days_scheduled = sum(
        task_map.get(s["task_id"], {}).get("overdue_days", 0)
        for s in schedule
    )
    downtime_hours_saved = round(float(total_overdue_days_scheduled * 24), 2)

    # 3. Conflicts resolved compared to naive baseline
    conflicts_resolved = baseline_result.get("conflict_count", 0)

    return {
        "uptime_pct": uptime_pct,
        "downtime_hours_saved": downtime_hours_saved,
        "conflicts_resolved": conflicts_resolved,
    }
