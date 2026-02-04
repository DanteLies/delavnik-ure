import React, { useState, useEffect } from 'react';
import { X, UserPlus, Users, Shield, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import type { User } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

// Create a separate client for admin actions to not interfere with main session
// We use the same credentials but ensure we don't persist session
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, currentUser }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  
  // New User Form
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Fetch all profiles (RLS allows admins to see all)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (e: any) {
      console.error('Error loading users:', e);
      setMessage({ type: 'error', text: 'Napaka pri nalaganju uporabnikov: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage(null);

    try {
      // Use the non-persisting client to sign up a new user
      const { data, error } = await adminClient.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            username: newUserUsername
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        setMessage({ type: 'success', text: `Uporabnik ${newUserUsername} uspešno ustvarjen!` });
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserUsername('');
        // Refresh list
        setTimeout(loadUsers, 1000);
      }
    } catch (e: any) {
      console.error('Error creating user:', e);
      setMessage({ type: 'error', text: e.message || 'Napaka pri ustvarjanju uporabnika.' });
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Admin Panel
          </h3>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            <AlertCircle className="w-4 h-4" />
            {message.text}
          </div>
        )}

        <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'list' 
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'
            }`}
          >
            Seznam Uporabnikov
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'create' 
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'
            }`}
          >
            Dodaj Uporabnika
          </button>
        </div>

        {activeTab === 'list' ? (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Ni drugih uporabnikov.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="p-3 font-semibold text-gray-600 dark:text-gray-300">Uporabnik</th>
                      <th className="p-3 font-semibold text-gray-600 dark:text-gray-300">Vloga</th>
                      <th className="p-3 font-semibold text-gray-600 dark:text-gray-300 text-right">Postavka</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="p-3">
                          <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
                          <div className="text-xs text-gray-500">{user.id.slice(0, 8)}...</div>
                        </td>
                        <td className="p-3">
                          {user.is_admin ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                              Uporabnik
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right text-gray-600 dark:text-gray-300">
                          {user.hourly_rate}€
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Uporabniško ime
              </label>
              <input
                type="text"
                value={newUserUsername}
                onChange={(e) => setNewUserUsername(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                placeholder="npr. Mojca"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                placeholder="mojca@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Geslo
              </label>
              <input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                placeholder="Najmanj 6 znakov"
                required
                minLength={6}
              />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>
                Ta obrazec bo ustvaril novega uporabnika v bazi. Uporabnik se bo lahko takoj prijavil s temi podatki.
              </p>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:bg-purple-700 transform active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Ustvari Uporabnika
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
