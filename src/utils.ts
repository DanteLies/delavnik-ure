import { differenceInMinutes, parse, format } from 'date-fns';
import type { Shift, DailyEntry } from './types';

export const HOURLY_RATE = 9;

export const calculateShiftHours = (shift: Shift): number => {
  if (!shift.startTime || !shift.endTime) return 0;
  
  const today = new Date();
  const start = parse(shift.startTime, 'HH:mm', today);
  const end = parse(shift.endTime, 'HH:mm', today);
  
  let diffMinutes = differenceInMinutes(end, start);
  
  // Handle overnight shifts (if end time is before start time)
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60;
  }
  
  return diffMinutes / 60;
};

export const calculateDailyHours = (shifts: Shift[]): number => {
  return shifts.reduce((total, shift) => total + calculateShiftHours(shift), 0);
};

export const calculateMonthlyHours = (entries: DailyEntry[], month: Date): number => {
  const monthStr = format(month, 'yyyy-MM');
  return entries
    .filter(entry => entry.date.startsWith(monthStr))
    .reduce((total, entry) => total + calculateDailyHours(entry.shifts), 0);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('sl-SI', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const formatHours = (hours: number): string => {
  return new Intl.NumberFormat('sl-SI', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(hours);
};
