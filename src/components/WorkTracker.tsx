import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar as CalendarIcon, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import type { DailyEntry, Shift } from '../types';
import { calculateDailyHours, calculateShiftHours, formatHours } from '../utils';
import { CalendarView } from './CalendarView';

interface WorkTrackerProps {
  entries: DailyEntry[];
  onUpdateEntries: (entries: DailyEntry[]) => void;
}

export const WorkTracker: React.FC<WorkTrackerProps> = ({ entries, onUpdateEntries }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentShifts, setCurrentShifts] = useState<Shift[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Load shifts for selected date
  useEffect(() => {
    const entry = entries.find(e => e.date === selectedDateStr);
    setCurrentShifts(entry ? entry.shifts : []);
  }, [selectedDateStr, entries]);

  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) return;

    const newShift: Shift = {
      id: crypto.randomUUID(),
      startTime,
      endTime
    };

    const updatedShifts = [...currentShifts, newShift];
    setCurrentShifts(updatedShifts);
    saveEntry(updatedShifts);
    
    // Reset inputs
    setStartTime('');
    setEndTime('');
    setShowAddModal(false);
  };

  const handleRemoveShift = (id: string) => {
    const updatedShifts = currentShifts.filter(s => s.id !== id);
    setCurrentShifts(updatedShifts);
    saveEntry(updatedShifts);
  };

  const saveEntry = (shifts: Shift[]) => {
    const newEntries = [...entries];
    const existingIndex = newEntries.findIndex(e => e.date === selectedDateStr);

    if (existingIndex >= 0) {
      if (shifts.length === 0) {
        newEntries.splice(existingIndex, 1);
      } else {
        newEntries[existingIndex] = { date: selectedDateStr, shifts };
      }
    } else if (shifts.length > 0) {
      newEntries.push({ date: selectedDateStr, shifts });
    }

    onUpdateEntries(newEntries);
  };

  const dailyTotal = calculateDailyHours(currentShifts);

  return (
    <div className="space-y-6">
      <CalendarView 
        currentDate={selectedDate}
        onDateChange={setSelectedDate}
        onSelectDate={(date) => {
          setSelectedDate(date);
          // Optional: Scroll to details or open modal if needed
        }}
        entries={entries}
      />

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              {format(selectedDate, 'd. MMMM yyyy', { locale: sl })}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Skupaj: <span className="font-bold text-blue-600 dark:text-blue-400">{formatHours(dailyTotal)}h</span>
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {currentShifts.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 italic">Ni vnosov za ta dan.</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
            >
              Dodaj prvi vnos
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentShifts.map((shift) => (
              <div key={shift.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-600 transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <span className="block font-semibold text-gray-900 dark:text-white text-lg">
                      {shift.startTime} - {shift.endTime}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Trajanje: {formatHours(calculateShiftHours(shift))}h
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveShift(shift.id)}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Shift Modal/Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Dodaj izmeno</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            
            <form onSubmit={handleAddShift} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Začetek</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Konec</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg dark:text-white"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transform active:scale-95 transition-all"
              >
                Potrdi vnos
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
