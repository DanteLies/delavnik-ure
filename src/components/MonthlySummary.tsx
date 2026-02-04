import React, { useState } from 'react';
import { Download, Calculator } from 'lucide-react';
import { format, endOfMonth, eachDayOfInterval, parse } from 'date-fns';
import { sl } from 'date-fns/locale';
import type { DailyEntry } from '../types';
import { calculateDailyHours, formatCurrency, formatHours } from '../utils';

interface MonthlySummaryProps {
  entries: DailyEntry[];
  hourlyRate: number;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({ entries, hourlyRate }) => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const handleExport = () => {
    const monthEntries = getMonthData();
    const csvContent = [
      ['Datum', 'Ure', 'Opomba', 'Znesek'],
      ...monthEntries.map(d => [
        format(d.date, 'd. M. yyyy'),
        formatHours(d.hours).replace('.', ','),
        d.comment || '',
        formatCurrency(d.hours * hourlyRate).replace('€', '').trim().replace('.', ',')
      ]),
      ['Skupaj', formatHours(totalHours).replace('.', ','), '', formatCurrency(totalSalary).replace('€', '').trim().replace('.', ',')]
    ]
    .map(e => e.join(';'))
    .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `obracun_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMonthData = () => {
    const start = parse(selectedMonth, 'yyyy-MM', new Date());
    const end = endOfMonth(start);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const entry = entries.find(e => e.date === dateStr);
      const hours = entry ? calculateDailyHours(entry.shifts) : 0;
      return {
        date: day,
        hours,
        comment: entry?.comment,
        salary: hours * hourlyRate
      };
    });
  };

  const monthData = getMonthData();
  const totalHours = monthData.reduce((acc, curr) => acc + curr.hours, 0);
  const totalSalary = totalHours * hourlyRate;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 transition-colors duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
          <Calculator className="w-6 h-6 text-blue-500" />
          Mesečni obračun
        </h2>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="flex-1 sm:flex-none px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-white"
          />
          <button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-green-500/20"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Izvozi</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">Skupaj ur</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{formatHours(totalHours)}h</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-2xl border border-green-100 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium uppercase tracking-wider">Urna postavka</p>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">{formatCurrency(hourlyRate)}/h</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-2xl border border-purple-100 dark:border-purple-800">
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wider">Skupaj plača</p>
          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">{formatCurrency(totalSalary)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Datum</th>
              <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Ure</th>
              <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Znesek</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {monthData.filter(d => d.hours > 0).map((day) => (
              <tr key={day.date.toISOString()} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="p-4 text-gray-900 dark:text-gray-200">
                  {format(day.date, 'd. M. yyyy', { locale: sl })}
                </td>
                <td className="p-4 text-right font-medium text-gray-900 dark:text-gray-200">
                  {formatHours(day.hours)}h
                </td>
                <td className="p-4 text-right text-gray-600 dark:text-gray-400">
                  {formatCurrency(day.salary)}
                </td>
              </tr>
            ))}
            {monthData.filter(d => d.hours > 0).length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500 dark:text-gray-400 italic">
                  Ni zabeleženih ur v tem mesecu.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-700/50 font-bold border-t dark:border-gray-700">
            <tr>
              <td className="p-4 text-gray-900 dark:text-white">Skupaj</td>
              <td className="p-4 text-right text-gray-900 dark:text-white">{formatHours(totalHours)}h</td>
              <td className="p-4 text-right text-gray-900 dark:text-white">{formatCurrency(totalSalary)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
