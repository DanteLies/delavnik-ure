import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { WorkTracker } from './components/WorkTracker';
import { MonthlySummary } from './components/MonthlySummary';
import type { DailyEntry, User } from './types';
import { Clock, LogOut, Sun, Moon } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [isDark, setIsDark] = useState(false);

  // Load auth state and theme on mount
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }

    // Auth
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        loadUserEntries(user.username);
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }, []);

  // Update theme class when state changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const loadUserEntries = (username: string) => {
    const savedEntries = localStorage.getItem(`workEntries_${username}`);
    if (savedEntries) {
      try {
        setEntries(JSON.parse(savedEntries));
      } catch (e) {
        console.error('Failed to parse entries', e);
        setEntries([]);
      }
    } else {
      setEntries([]);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    loadUserEntries(user.username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEntries([]);
    localStorage.removeItem('currentUser');
  };

  const handleUpdateEntries = (newEntries: DailyEntry[]) => {
    setEntries(newEntries);
    if (currentUser) {
      localStorage.setItem(`workEntries_${currentUser.username}`, JSON.stringify(newEntries));
    }
  };

  const toggleTheme = () => setIsDark(!isDark);

  if (!currentUser) {
    return <Login onLogin={handleLogin} isDark={isDark} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 pb-12">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">Evidenca Dela</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Dobrodošel, {currentUser.username}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              title="Preklopi temo"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Odjava</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <WorkTracker entries={entries} onUpdateEntries={handleUpdateEntries} />
        <MonthlySummary entries={entries} />
        
      </main>
    </div>
  );
}

export default App;
