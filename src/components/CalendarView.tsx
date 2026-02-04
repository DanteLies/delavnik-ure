import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
} from 'date-fns';
import { sl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DailyEntry } from '../types';
import { calculateDailyHours, formatHours } from '../utils';
import clsx from 'clsx';

interface CalendarViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
  entries: DailyEntry[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  currentDate, 
  onDateChange, 
  onSelectDate,
  entries 
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned'];

  const getDayData = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = entries.find(e => e.date === dateStr);
    const hours = entry ? calculateDailyHours(entry.shifts) : 0;
    return { hasEntry: !!entry, hours };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-4 sm:p-6 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: sl })}
        </h2>
        <div className="flex gap-1 sm:gap-2">
          <button 
            onClick={() => onDateChange(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onDateChange(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1 sm:mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((day) => {
          const { hasEntry, hours } = getDayData(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isSelected = day.getDate() === currentDate.getDate() && isSameMonth(day, currentDate);
          
          return (
            <button
              key={day.toString()}
              onClick={() => onSelectDate(day)}
              className={clsx(
                'relative h-12 sm:h-20 rounded-xl flex flex-col items-center justify-start pt-1 sm:pt-2 transition-all border',
                !isCurrentMonth && 'bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-600 border-transparent',
                isCurrentMonth && 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500',
                isSelected && 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 z-10',
                isToday(day) && !isSelected && 'border-blue-500 border-2',
              )}
            >
              <span className={clsx(
                "text-xs sm:text-sm font-medium w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full mb-0 sm:mb-1",
                isToday(day) ? "bg-blue-600 text-white" : ""
              )}>
                {format(day, 'd')}
              </span>
              
              {hasEntry && hours > 0 && (
                <div className="flex flex-col items-center">
                  <span className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 leading-none">
                    {formatHours(hours)}
                  </span>
                  <div className="w-1 h-1 bg-blue-500 rounded-full mt-0.5 sm:mt-1"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
