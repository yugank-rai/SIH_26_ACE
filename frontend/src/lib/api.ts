import {
  Defect,
  TrainTimetable,
  GoodsForecast,
  ScheduleResponse,
  RunMetrics,
  GenerateScheduleResponse,
} from '../types';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// Ensure base has no trailing slash and includes /api if missing
const BASE_URL = RAW_API_URL.endsWith('/api')
  ? RAW_API_URL
  : `${RAW_API_URL.replace(/\/$/, '')}/api`;

export type ToastType = 'success' | 'error' | 'info';

export const dispatchToast = (message: string, type: ToastType = 'info') => {
  window.dispatchEvent(
    new CustomEvent('railaid-toast', {
      detail: { message, type, id: Date.now() },
    })
  );
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      let errorMessage = `HTTP Error ${res.status}`;
      try {
        const errorBody = await res.json();
        errorMessage = errorBody.error || errorBody.message || errorMessage;
      } catch {
        const text = await res.text();
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    return (await res.json()) as T;
  } catch (error: any) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error);
    dispatchToast(error?.message || 'Network request failed', 'error');
    throw error;
  }
}

// 1. Defects API
export async function getDefects(): Promise<Defect[]> {
  return apiRequest<Defect[]>('/defects');
}

export async function createDefect(data: {
  dept_id: number;
  corridor_id: string;
  asset_id?: string;
  defect_type: string;
  severity: number;
  overdue_days: number;
  status?: string;
}): Promise<Defect> {
  return apiRequest<Defect>('/defects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 2. Corridors API
export async function getTimetable(): Promise<TrainTimetable[]> {
  return apiRequest<TrainTimetable[]>('/timetable');
}

export async function getGoodsForecast(): Promise<GoodsForecast[]> {
  return apiRequest<GoodsForecast[]>('/goods-forecast');
}

// 3. Schedule API
export async function getSchedule(horizon: 'weekly' | 'monthly'): Promise<ScheduleResponse> {
  return apiRequest<ScheduleResponse>(`/schedule?horizon=${horizon}`);
}

export async function generateSchedule(horizon: 'weekly' | 'monthly'): Promise<GenerateScheduleResponse> {
  return apiRequest<GenerateScheduleResponse>('/schedule/generate', {
    method: 'POST',
    body: JSON.stringify({ horizon }),
  });
}

// 4. Metrics API
export async function getMetrics(horizon: 'weekly' | 'monthly'): Promise<RunMetrics | null> {
  try {
    return await apiRequest<RunMetrics>(`/metrics?horizon=${horizon}`);
  } catch (err: any) {
    if (err.message?.includes('404') || err.message?.includes('No metrics found')) {
      return null;
    }
    throw err;
  }
}
