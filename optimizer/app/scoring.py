def compute_score(task: dict) -> float:
    SEVERITY_WEIGHT = 0.4
    OVERDUE_WEIGHT = 0.35
    SAFETY_WEIGHT = 0.25

    severity_score = task["severity"] / 5.0
    overdue_score = min(task["overdue_days"] / 30, 1.0)
    safety_score = classify_safety_factor(task["defect_type"])

    return round(
        SEVERITY_WEIGHT * severity_score +
        OVERDUE_WEIGHT * overdue_score +
        SAFETY_WEIGHT * safety_score,
        4
    )


def classify_safety_factor(defect_type: str) -> float:
    """
    Keyword-based classification since defect_type is free-text, not a clean enum.
    Order matters — check highest-risk keywords first.
    """
    text = defect_type.lower()

    HIGH_RISK_KEYWORDS = ["rail", "track", "joint", "fracture", "crack", "flaw", "weld"]
    MEDIUM_HIGH_KEYWORDS = ["signal", "interlocking", "relay", "circuit breaker", "block instrument"]
    MEDIUM_KEYWORDS = ["ohe", "wire", "insulator", "flashover", "traction", "cable"]
    LOW_KEYWORDS = ["clip", "fastener", "pandrol", "led", "degradation"]

    if any(k in text for k in HIGH_RISK_KEYWORDS):
        return 0.9
    if any(k in text for k in MEDIUM_HIGH_KEYWORDS):
        return 0.8
    if any(k in text for k in MEDIUM_KEYWORDS):
        return 0.65
    if any(k in text for k in LOW_KEYWORDS):
        return 0.45
    return 0.5  # genuine default for anything unclassified
