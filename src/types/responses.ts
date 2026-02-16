/**
 * Agent-first CLI response types
 * Following HATEOAS principles for next actions
 */

export interface NextAction {
  command: string;
  description: string;
}

export interface SuccessResponse<T = any> {
  ok: true;
  command: string;
  result: T;
  next_actions: NextAction[];
}

export interface ErrorResponse {
  ok: false;
  command: string;
  error: {
    message: string;
    code: string;
  };
  fix: string;
  next_actions: NextAction[];
}

export type CLIResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Health data types (mock data structures)
export interface HRVData {
  date: string;
  value: number; // milliseconds
  category: 'low' | 'normal' | 'high';
}

export interface SleepData {
  date: string;
  duration_hours: number;
  deep_sleep_hours: number;
  rem_sleep_hours: number;
  sleep_score: number;
  bedtime: string;
  wake_time: string;
}

export interface HealthStatus {
  date: string;
  hrv: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    category: 'low' | 'normal' | 'high';
  };
  sleep: {
    last_night_hours: number;
    avg_7_day: number;
    score: number;
  };
  activity: {
    steps: number;
    active_calories: number;
    exercise_minutes: number;
  };
  alerts: string[];
}

export interface AlertThreshold {
  metric: string;
  threshold: number;
  current: number;
  status: 'ok' | 'warning' | 'critical';
  message: string;
}

export interface ImportResult {
  file: string;
  records_processed: number;
  data_types: string[];
  date_range: {
    start: string;
    end: string;
  };
  warnings: string[];
}