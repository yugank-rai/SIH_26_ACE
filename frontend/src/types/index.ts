export interface Department {
  id: number;
  name: 'Engineering' | 'S&T' | 'Traction Distribution';
}

export interface Defect {
  id: number;
  dept_id: number;
  department_name: 'Engineering' | 'S&T' | 'Traction Distribution';
  corridor_id: string;
  asset_id: string;
  defect_type: string;
  severity: number;
  overdue_days: number;
  status: string;
  created_at: string;
}

export interface TrainTimetable {
  id: number;
  corridor_id: string;
  train_id: string;
  start_time: string;
  end_time: string;
}

export interface GoodsForecast {
  id: number;
  corridor_id: string;
  window_start: string;
  window_end: string;
  priority: string;
}

export interface ScheduleItem {
  id: number;
  run_id: string;
  defect_id: number;
  slot_id: number | null;
  horizon: 'weekly' | 'monthly';
  score: string | number;
  status: 'scheduled' | 'unscheduled';
  reason_code: 'LOWER_PRIORITY' | 'NO_CORRIDOR_SLOT' | 'CAPACITY_EXCEEDED' | null;
  created_at: string;
  corridor_id: string;
  asset_id: string;
  defect_type: string;
  severity: number;
  overdue_days: number;
  department_name: 'Engineering' | 'S&T' | 'Traction Distribution';
  slot_start_time?: string;
  slot_end_time?: string;
}

export interface ScheduleResponse {
  run_id: string | null;
  horizon: 'weekly' | 'monthly';
  schedule: ScheduleItem[];
  unscheduled: ScheduleItem[];
  results: ScheduleItem[];
}

export interface RunMetrics {
  id: number;
  run_id: string;
  horizon: 'weekly' | 'monthly';
  uptime_pct: string | number;
  downtime_hours_saved: string | number;
  conflicts_resolved: number;
  created_at: string;
}

export interface GenerateScheduleResponse {
  run_id: string;
  horizon: 'weekly' | 'monthly';
  schedule: Array<{ task_id: number; slot_id: number; score: number }>;
  unscheduled: Array<{ task_id: number; reason_code: string; score: number }>;
  metrics: {
    uptime_pct: number;
    downtime_hours_saved: number;
    conflicts_resolved: number;
  };
}
