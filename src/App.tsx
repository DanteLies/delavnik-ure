import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { WorkTracker } from './components/WorkTracker';
import { MonthlySummary } from './components/MonthlySummary';
import { Settings } from './components/Settings';
import { AdminPanel } from './components/AdminPanel';
import type { DailyEntry, User } from './types';
import { Clock, LogOut, Sun, Moon, Settings as SettingsIcon, Loader2, Shield } from 'lucide-react';
import { supabase } from './supabase';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(9);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const user: User = {
            id: session.user.id,
            email: session.user.email,
            username: profile?.username || session.user.user_metadata?.username || 'Uporabnik',
            hourly_rate: profile?.hourly_rate || 9,
            is_admin: profile?.is_admin || false
          };

          setCurrentUser(user);
          setHourlyRate(user.hourly_rate || 9);
          loadUserEntries(user.id);
        } else {
          setCurrentUser(null);
          setEntries([]);
          setHourlyRate(9);
        }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error('Error checking user session:', e);
      setLoading(false);
    }
  };

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

  const loadUserEntries = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (data) {
        setEntries(data);
      }
    } catch (e) {
      console.error('Error loading entries:', e);
    }
  };

  const handleLogin = (user: User) => {
    // This is now handled by onAuthStateChange
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdateEntries = async (newEntries: DailyEntry[]) => {
    // Optimistic update
    setEntries(newEntries);
    // Note: Actual DB update logic should be in WorkTracker or we need to pass specific change
    // Since handleUpdateEntries usually receives the whole array in the old local storage version,
    // we should adapt WorkTracker to call DB functions directly or handle sync here.
    // For now, let's reload entries to be safe or just keep optimistic.
    // Ideally WorkTracker calls specific add/remove/update functions.
    // But to keep changes minimal, let's leave this empty and let WorkTracker handle DB calls.
    // Wait, WorkTracker calls onUpdateEntries. We should probably just refresh data here.
    if (currentUser) {
      loadUserEntries(currentUser.id);
    }
  };

  const handleHourlyRateChange = async (rate: number) => {
    setHourlyRate(rate);
    if (currentUser) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ hourly_rate: rate })
          .eq('id', currentUser.id);

        if (error) throw error;
      } catch (e) {
        console.error('Error updating hourly rate:', e);
      }
    }
  };

  const toggleTheme = () => setIsDark(!isDark);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

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
            {currentUser.is_admin && (
              <button
                onClick={() => setIsAdminPanelOpen(true)}
                className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 transition-colors"
                title="Admin Panel"
              >
                <Shield className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              title="Nastavitve"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>

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
        <WorkTracker 
          entries={entries} 
          onUpdateEntries={handleUpdateEntries} 
          currentUser={currentUser} // Pass currentUser to WorkTracker
        />
        <MonthlySummary entries={entries} hourlyRate={hourlyRate} />
      </main>

      <Settings 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        hourlyRate={hourlyRate}
        setHourlyRate={handleHourlyRateChange}
        entries={entries}
        onUpdateEntries={handleUpdateEntries}
        username={currentUser.username}
        userId={currentUser.id}
      />
      
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}

export default App;
