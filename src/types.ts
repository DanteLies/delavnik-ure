export interface Shift {
  id: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface DailyEntry {
  date: string; // YYYY-MM-DD
  shifts: Shift[];
  comment?: string;
}

export interface User {
  username: string;
  password?: string; // Optional for users created locally without password initially? No, let's require it.
  isAdmin?: boolean;
}

export interface WorkData {
  entries: DailyEntry[];
}
