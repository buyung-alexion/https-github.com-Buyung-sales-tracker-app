import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Sales } from '../types';

interface AuthContextType {
  user: Sales | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (newData: Partial<Sales>) => void;
  isLoggedIn: boolean;
  role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get initial state synchronously
const getInitialUser = (): Sales | null => {
  const saved = localStorage.getItem('st_auth_user');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      localStorage.removeItem('st_auth_user');
    }
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Sales | null>(getInitialUser);
  // If we found a user in localStorage, we can start with loading: false
  const [loading, setLoading] = useState(false);

  // Sync with Supabase session if needed in the background
  useEffect(() => {
    // Initial check is done, but we could add a token validation here if needed
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .ilike('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        return { success: false, message: 'Username atau Password salah' };
      }

      setUser(data);
      localStorage.setItem('st_auth_user', JSON.stringify(data));
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
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      updateUser,
      isLoggedIn: !!user,
      role: user?.role || 'sales'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
