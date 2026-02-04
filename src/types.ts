export interface Shift {
  id: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface DailyEntry {
  id?: string; // UUID from DB
  date: string; // YYYY-MM-DD
  shifts: Shift[];
  comment?: string;
  user_id?: string;
}

export interface User {
  id: string;
  email?: string;
  username: string;
  hourly_rate?: number;
  is_admin?: boolean;
}

export interface WorkData {
  entries: DailyEntry[];
}
