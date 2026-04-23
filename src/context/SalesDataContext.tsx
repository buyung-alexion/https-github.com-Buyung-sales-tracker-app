import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { SystemTargets, Prospek, Customer, Activity, Sales } from '../types';

interface SalesDataContextType {
  sales: Sales[];
  allSales: Sales[];
  prospek: Prospek[];
  customers: Customer[];
  activities: Activity[];
  systemTargets: SystemTargets | null;
  masterAreas: {id: string, name: string}[];
  masterCategories: {id: string, name: string}[];
  masterChannels: {id: string, name: string}[];
  masterStatuses: {id: string, name: string}[];
  masterActions: {id: string, name: string}[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const SalesDataContext = createContext<SalesDataContextType | undefined>(undefined);

export function SalesDataProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [sales, setSales] = useState<Sales[]>([]);
  const [allSales, setAllSales] = useState<Sales[]>([]);
  const [prospek, setProspek] = useState<Prospek[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [systemTargets, setSystemTargets] = useState<SystemTargets | null>(null);
  const [masterAreas, setMasterAreas] = useState<{id: string, name: string}[]>([]);
  const [masterCategories, setMasterCategories] = useState<{id: string, name: string}[]>([]);
  const [masterChannels, setMasterChannels] = useState<{id: string, name: string}[]>([]);
  const [masterStatuses, setMasterStatuses] = useState<{id: string, name: string}[]>([]);
  const [masterActions, setMasterActions] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchTimeoutRef = React.useRef<any>(null);

  const fetchData = useCallback(async () => {
    try {
      // Parallel fetch but individual handling to prevent one failure from blocking others
      const [resSales, resProspek, resCustomer, resActivity, resTargets, resMA, resMC, resMCH, resMS, resMAC] = await Promise.all([
        supabase.from('sales').select('*').order('id'),
        supabase.from('prospek').select('*').order('created_at', { ascending: false }),
        supabase.from('customer').select('*').order('tanggal_join', { ascending: false }),
        supabase.from('activity').select('*').order('timestamp', { ascending: false }),
        supabase.from('system_targets').select('*').eq('id', 1).maybeSingle(), // Use maybeSingle to avoid 406 errors if missing
        supabase.from('master_areas').select('*').order('name'),
        supabase.from('master_categories').select('*').order('name'),
        supabase.from('master_channels').select('*').order('name'),
        supabase.from('master_prospect_status').select('*').order('name'),
        supabase.from('master_actions').select('*').order('name')
      ]);

      // Logging for diagnostics (useful during deployment validation)
      if (resCustomer.error) console.error('Customer fetch error:', resCustomer.error);
      if (resProspek.error) console.error('Prospek fetch error:', resProspek.error);
      if (resActivity.error) console.error('Activity fetch error:', resActivity.error);

      const allSalesData = resSales.data || [];
      const salesOnly = allSalesData.filter(s => (s.role || '').toLowerCase() === 'sales');
      
      setSales(salesOnly);
      setAllSales(allSalesData);
      setProspek(resProspek.data || []);
      setCustomers(resCustomer.data || []);
      setActivities(resActivity.data || []);
      if (resTargets.data) setSystemTargets(resTargets.data);
      setMasterAreas(resMA.data || []);
      setMasterCategories(resMC.data || []);
      setMasterChannels(resMCH.data || []);
      setMasterStatuses(resMS.data || []);
      setMasterActions(resMAC.data || []);

      console.log(`[SalesDataContext] Initialized. Items: ${resCustomer.data?.length || 0} Customers, ${resProspek.data?.length || 0} Prospeks`);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_areas' }, () => debouncedFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_categories' }, () => debouncedFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_channels' }, () => debouncedFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_prospect_status' }, () => debouncedFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_actions' }, () => debouncedFetch())
      .subscribe();

    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, fetchData, debouncedFetch]);

  const value = {
    sales,
    allSales,
    prospek,
    customers,
    activities,
    systemTargets,
    masterAreas,
    masterCategories,
    masterChannels,
    masterStatuses,
    masterActions,
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
