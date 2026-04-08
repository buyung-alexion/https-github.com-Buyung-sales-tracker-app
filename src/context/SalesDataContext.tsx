import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { SystemTargets, Prospek, Customer, Activity, Sales } from '../types';

interface SalesDataContextType {
  sales: Sales[];
  prospek: Prospek[];
  customers: Customer[];
  activities: Activity[];
  systemTargets: SystemTargets | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SalesDataContext = createContext<SalesDataContextType | undefined>(undefined);

export function SalesDataProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [sales, setSales] = useState<Sales[]>([]);
  const [prospek, setProspek] = useState<Prospek[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [systemTargets, setSystemTargets] = useState<SystemTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchTimeoutRef = React.useRef<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [resSales, resProspek, resCustomer, resActivity, resTargets] = await Promise.all([
        supabase.from('sales').select('*').order('id'),
        supabase.from('prospek').select('*').order('created_at', { ascending: false }),
        supabase.from('customer').select('*').order('tanggal_join', { ascending: false }),
        supabase.from('activity').select('*').order('timestamp', { ascending: false }),
        supabase.from('system_targets').select('*').eq('id', 1).single()
      ]);

      const filteredSales = (resSales.data || []).filter(s => {
        const r = (s.role || '').toLowerCase();
        return r.includes('sales') || r.includes('salesman') || r.includes('marketing');
      });
      
      setSales(filteredSales);
      setProspek(resProspek.data || []);
      setCustomers(resCustomer.data || []);
      setActivities(resActivity.data || []);
      if (resTargets.data) setSystemTargets(resTargets.data);
    } catch (err) {
      console.error('Error fetching data central:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetch = useCallback(() => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      fetchData();
    }, 1500);
  }, [fetchData]);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    fetchData();

    const channel = supabase.channel('st_global_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => debouncedFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prospek' }, () => debouncedFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer' }, () => debouncedFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity' }, () => debouncedFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_targets' }, () => debouncedFetch())
      .subscribe();

    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, fetchData, debouncedFetch]);

  const value = {
    sales,
    prospek,
    customers,
    activities,
    systemTargets,
    loading,
    refresh: fetchData
  };

  return (
    <SalesDataContext.Provider value={value}>
      {children}
    </SalesDataContext.Provider>
  );
}

export function useSalesDataContext() {
  const context = useContext(SalesDataContext);
  if (context === undefined) {
    throw new Error('useSalesDataContext must be used within a SalesDataProvider');
  }
  return context;
}
