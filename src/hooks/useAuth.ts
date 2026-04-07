import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Sales } from '../types';

export function useAuth() {
  const [user, setUser] = useState<Sales | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('st_auth_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        return { success: false, message: 'Username atau Password salah' };
      }

      setUser(data);
      localStorage.setItem('st_auth_user', JSON.stringify(data));
      // Backwards compatibility for existing tools
      localStorage.setItem('st_current_sales', data.id);
      
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Terjadi kesalahan sistem' };
    }
  };

  const updateUser = (newData: Partial<Sales>) => {
    if (!user) return;
    const updated = { ...user, ...newData };
    setUser(updated);
    localStorage.setItem('st_auth_user', JSON.stringify(updated));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('st_auth_user');
    localStorage.removeItem('st_current_sales');
    window.location.href = '/';
  };

  return { 
    user, 
    loading, 
    login, 
    logout,
    updateUser, 
    isLoggedIn: !!user,
    role: user?.role || 'sales'
  };
}
