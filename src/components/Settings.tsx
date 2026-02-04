import React, { useRef, useState } from 'react';
import { X, Download, Upload, Save, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import type { DailyEntry } from '../types';
import { supabase } from '../supabase';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  hourlyRate: number;
  setHourlyRate: (rate: number) => void;
  entries: DailyEntry[];
  onUpdateEntries: (entries: DailyEntry[]) => void;
  username: string;
  userId: string;
}

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  hourlyRate,
  setHourlyRate,
  entries,
  onUpdateEntries,
  username,
  userId
}) => {
  const [tempRate, setTempRate] = useState(hourlyRate.toString());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleSaveRate = () => {
    const rate = parseFloat(tempRate);
    if (!isNaN(rate) && rate > 0) {
      setHourlyRate(rate);
      setMessage({ type: 'success', text: 'Urna postavka shranjena!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: 'Neveljavna urna postavka.' });
    }
  };

  const handleExport = () => {
    const data = {
      version: 1,
      username,
      hourlyRate,
      entries
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delavnik-ure-backup-${username}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: 'Podatki uspešno izvoženi!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Basic validation
        if (data.username && data.entries && Array.isArray(data.entries)) {
          // Import hourly rate if present
          if (data.hourlyRate) {
            setHourlyRate(data.hourlyRate);
          }
          
          // Prepare entries for Supabase upsert
          const entriesToUpsert = data.entries.map((entry: DailyEntry) => ({
            user_id: userId,
            date: entry.date,
            shifts: entry.shifts,
            comment: entry.comment,
            updated_at: new Date().toISOString()
          }));

          if (entriesToUpsert.length > 0) {
            // Upsert to Supabase
            // We rely on the unique constraint on (user_id, date) to handle duplicates/updates
            const { error } = await supabase
              .from('entries')
              .upsert(entriesToUpsert, { onConflict: 'user_id, date' });

            if (error) throw error;
          }
          
          // Trigger refresh
          onUpdateEntries([]);
          setMessage({ type: 'success', text: 'Podatki uspešno uvoženi v bazo!' });
        } else {
          throw new Error('Neveljavna oblika datoteke');
        }
      } catch (err: any) {
        console.error(err);
        setMessage({ type: 'error', text: 'Napaka pri uvozu: ' + (err.message || 'Neznana napaka') });
      } finally {
        setIsImporting(false);
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setTimeout(() => setMessage(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            Nastavitve
          </h3>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Hourly Rate Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Urna postavka (€)
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                step="0.1"
                value={tempRate}
                onChange={(e) => setTempRate(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              />
              <button
                onClick={handleSaveRate}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Shrani
              </button>
            </div>
          </div>

          <div className="border-t dark:border-gray-700 pt-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Upravljanje s podatki
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Uvoz in izvoz podatkov (JSON format). Pri uvozu se podatki shranijo v bazo.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExport}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl transition-all"
              >
                <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Izvozi</span>
              </button>

              <button
                onClick={handleImportClick}
                disabled={isImporting}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl transition-all disabled:opacity-50"
              >
                {isImporting ? (
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isImporting ? 'Uvažam...' : 'Uvozi'}
                </span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
