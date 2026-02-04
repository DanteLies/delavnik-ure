import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { X, TrendingUp, Euro, Clock, Calendar } from 'lucide-react';
import { format, parseISO, startOfMonth } from 'date-fns';
import { sl } from 'date-fns/locale';
import type { DailyEntry } from '../types';
import { calculateDailyHours } from '../utils';

interface StatisticsProps {
  isOpen: boolean;
  onClose: () => void;
  entries: DailyEntry[];
  hourlyRate: number;
}

export const Statistics: React.FC<StatisticsProps> = ({ isOpen, onClose, entries, hourlyRate }) => {
  if (!isOpen) return null;

  const statsData = useMemo(() => {
    if (entries.length === 0) return [];

    // 1. Group entries by month
    const monthlyData: Record<string, { hours: number; earnings: number; date: Date }> = {};

    entries.forEach(entry => {
      const date = parseISO(entry.date);
      const monthKey = format(date, 'yyyy-MM');
      const hours = calculateDailyHours(entry.shifts);
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          hours: 0,
          earnings: 0,
          date: startOfMonth(date)
        };
      }
      
      monthlyData[monthKey].hours += hours;
      monthlyData[monthKey].earnings += hours * hourlyRate;
    });

    // 2. Sort by date and format for chart
    return Object.values(monthlyData)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(item => ({
        name: format(item.date, 'MMM yyyy', { locale: sl }),
        fullDate: format(item.date, 'MMMM yyyy', { locale: sl }),
        hours: Math.round(item.hours * 100) / 100,
        earnings: Math.round(item.earnings * 100) / 100
      }));
  }, [entries, hourlyRate]);

  const totals = useMemo(() => {
    return statsData.reduce((acc, curr) => ({
      hours: acc.hours + curr.hours,
      earnings: acc.earnings + curr.earnings
    }), { hours: 0, earnings: 0 });
  }, [statsData]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Statistika</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pregled ur in zaslužka</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Skupaj Ure</span>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {totals.hours.toLocaleString('sl-SI', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800/50">
              <div className="flex items-center gap-3 mb-2">
                <Euro className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Skupaj Zaslužek</span>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {totals.earnings.toLocaleString('sl-SI', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-800/50">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Obdobje</span>
              </div>
              <p className="text-lg font-bold text-gray-800 dark:text-white truncate">
                {statsData.length > 0 ? `${statsData[0].name} - ${statsData[statsData.length - 1].name}` : '-'}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 h-[400px]">
             {statsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={statsData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    stroke="#3B82F6" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#3B82F6', fontSize: 12 }}
                    label={{ value: 'Ure (h)', angle: -90, position: 'insideLeft', fill: '#3B82F6' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#10B981" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#10B981', fontSize: 12 }}
                    label={{ value: 'Zaslužek (€)', angle: 90, position: 'insideRight', fill: '#10B981' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                    }}
                    labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '8px' }}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="hours" 
                    name="Ure" 
                    fill="#3B82F6" 
                    radius={[4, 4, 0, 0]} 
                    barSize={30}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="earnings" 
                    name="Zaslužek (€)" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-gray-400">
                 Ni podatkov za prikaz
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
