# POST /optimize API Contract

This document specifies the exact request and response JSON schema contract between the RailAID Backend (Node.js/Express) and the RailAID Optimizer Engine (Python/FastAPI).

---

## 1. Endpoint Overview

- **Method**: `POST`
- **Path**: `/optimize`
- **Content-Type**: `application/json`
- **Description**: Evaluates multi-criteria defect scores, resolves corridor contention using Google OR-Tools CP-SAT integer optimization, compares against an uncoordinated manual baseline, and returns optimal slot assignments with performance metrics.

---

## 2. Request Schema

### Root Object

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `tasks` | `Array<TaskItem>` | Yes | List of candidate defect tickets awaiting scheduling. |
| `available_slots` | `Array<AvailableSlotItem>` | Yes | List of available corridor maintenance blocks. |
| `horizon` | `string` | Yes | Planning horizon (`"weekly"` or `"monthly"`). |

### `TaskItem`

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `integer` | Primary key | Unique identifier for the defect. |
| `corridor_id` | `string` | Non-empty | Railway corridor station-pair (e.g., `"NDLS-PNP"`). |
| `severity` | `integer` | `1 <= severity <= 5` | Priority rating (5 = critical). |
| `overdue_days` | `integer` | `overdue_days >= 0` | Days overdue beyond maintenance SLA. |
| `defect_type` | `string` | Non-empty | Descriptive defect category for safety classification. |

### `AvailableSlotItem`

| Field | Type | Format | Description |
| :--- | :--- | :--- | :--- |
| `id` | `integer` | Primary key | Unique identifier for the available slot. |
| `corridor_id` | `string` | Non-empty | Corridor identifier where the block is available. |
| `start_time` | `string` | ISO 8601 string | Scheduled block start timestamp. |
| `end_time` | `string` | ISO 8601 string | Scheduled block completion timestamp. |

---

## 3. Response Schema

### Root Object

| Field | Type | Description |
| :--- | :--- | :--- |
| `schedule` | `Array<ScheduledItem>` | List of tasks successfully allocated to corridor slots. |
| `unscheduled` | `Array<UnscheduledItem>` | List of tasks that could not be allocated during this horizon. |
| `metrics` | `MetricsOutput` | Optimization impact KPIs and baseline comparison. |

### `ScheduledItem`

| Field | Type | Description |
| :--- | :--- | :--- |
| `task_id` | `integer` | ID of the assigned defect. |
| `slot_id` | `integer` | ID of the allocated corridor slot. |
| `score` | `number (float)` | Calculated composite priority score (0.0 to 1.0). |

### `UnscheduledItem`

| Field | Type | Description |
| :--- | :--- | :--- |
| `task_id` | `integer` | ID of the unallocated defect. |
| `reason_code` | `string` | `"NO_CORRIDOR_SLOT"` (no matching corridor slots exist) or `"LOWER_PRIORITY"` (slots filled by higher-scoring tasks). |
| `score` | `number (float)` | Calculated composite priority score. |

### `MetricsOutput`

| Field | Type | Description |
| :--- | :--- | :--- |
| `uptime_pct` | `number (float)` | Percentage of candidate tasks scheduled: `(scheduled / total) * 100`. |
| `downtime_hours_saved`| `number (float)` | Sum of overdue days for all scheduled tasks * 24 hours. |
| `conflicts_resolved` | `integer` | Number of slot double-booking conflicts prevented relative to naive baseline. |

---

## 4. Example Request

```json
{
  "tasks": [
    {
      "id": 1,
      "corridor_id": "NDLS-PNP",
      "severity": 5,
      "overdue_days": 20,
      "defect_type": "track_defect"
    },
    {
      "id": 2,
      "corridor_id": "NDLS-PNP",
      "severity": 2,
      "overdue_days": 3,
      "defect_type": "routine_inspection"
    },
    {
      "id": 3,
      "corridor_id": "NDLS-GZB",
      "severity": 4,
      "overdue_days": 15,
      "defect_type": "signal_fault"
    }
  ],
  "available_slots": [
    {
      "id": 1,
      "corridor_id": "NDLS-PNP",
      "start_time": "2026-09-05T08:00:00",
      "end_time": "2026-09-05T10:00:00"
    },
    {
      "id": 2,
      "corridor_id": "NDLS-GZB",
      "start_time": "2026-09-05T09:00:00",
      "end_time": "2026-09-05T11:00:00"
    }
  ],
  "horizon": "weekly"
}
```

---

## 5. Example Response

```json
{
  "schedule": [
    {
      "task_id": 1,
      "slot_id": 1,
      "score": 0.8583
    },
    {
      "task_id": 3,
      "slot_id": 2,
      "score": 0.695
    }
  ],
  "unscheduled": [
    {
      "task_id": 2,
      "reason_code": "LOWER_PRIORITY",
      "score": 0.32
    }
  ],
  "metrics": {
    "uptime_pct": 66.7,
    "downtime_hours_saved": 840.0,
    "conflicts_resolved": 1
  }
}
```
