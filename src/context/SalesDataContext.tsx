import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { SystemTargets, Prospek, Customer, Activity, Sales, SalesOrder } from '../types';




interface SalesDataContextType {
  sales: Sales[];
  allSales: Sales[];
  prospek: Prospek[];
  customers: Customer[];
  activities: Activity[];
  orders: SalesOrder[];
  systemTargets: SystemTargets | null;
  masterAreas: {id: string, name: string}[];
  masterCategories: {id: string, name: string}[];
  masterProductCategories: {id: string, name: string}[];
  masterChannels: {id: string, name: string}[];
  masterStatuses: {id: string, name: string}[];
  masterActions: {id: string, name: string}[];
  masterUnits: {id: string, name: string}[];
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
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [systemTargets, setSystemTargets] = useState<SystemTargets | null>(null);
  const [masterAreas, setMasterAreas] = useState<{id: string, name: string}[]>([]);
  const [masterCategories, setMasterCategories] = useState<{id: string, name: string}[]>([]);
  const [masterProductCategories, setMasterProductCategories] = useState<{id: string, name: string}[]>([]);
  const [masterChannels, setMasterChannels] = useState<{id: string, name: string}[]>([]);
  const [masterStatuses, setMasterStatuses] = useState<{id: string, name: string}[]>([]);
  const [masterActions, setMasterActions] = useState<{id: string, name: string}[]>([]);
  const [masterUnits, setMasterUnits] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchTimeoutRef = React.useRef<any>(null);

  const fetchData = useCallback(async () => {
    try {
      // Parallel fetch but individual handling to prevent one failure from blocking others
      const [resSales, resProspek, resCustomer, resActivity, resTargets, resMA, resMC, resMCH, resMS, resMAC, resOrders, resMPC, resMU] = await Promise.all([
        supabase.from('sales').select('*').order('id'),
        supabase.from('prospek').select('*').order('created_at', { ascending: false }),
        supabase.from('customer').select('*').order('tanggal_join', { ascending: false }),
        supabase.from('activity').select('*').order('timestamp', { ascending: false }),
        supabase.from('system_targets').select('*').eq('id', 1).maybeSingle(), 
        supabase.from('master_areas').select('*').order('name'),
        supabase.from('master_categories').select('*').order('name'),
        supabase.from('master_channels').select('*').order('name'),
        supabase.from('master_prospect_status').select('*').order('name'),
        supabase.from('master_actions').select('*').order('name'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('master_product_categories').select('*').order('name'),
        supabase.from('master_units').select('*').order('name')
      ]);

      // Logging for diagnostics (useful during deployment validation)
      if (resCustomer.error) console.error('Customer fetch error:', resCustomer.error);
      if (resProspek.error) console.error('Prospek fetch error:', resProspek.error);
      if (resActivity.error) console.error('Activity fetch error:', resActivity.error);
      if (resMPC.error) console.error('Master Product Category fetch error (Table might be missing):', resMPC.error);
      if (resMS.error) console.error('Master Status fetch error:', resMS.error);
      if (resMAC.error) console.error('Master Actions fetch error:', resMAC.error);

      const allSalesData = resSales.data || [];
      const salesOnly = allSalesData.filter(s => (s.role || '').toLowerCase() === 'sales');
      
      setSales(salesOnly);
      setAllSales(allSalesData);
      setProspek(resProspek.data || []);
      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const customersWithTargets = (resCustomer.data || []).map((c: any) => {
        let target_volume = 0;
        if (c.status && c.status.startsWith(`TARGET_${currentMonthStr}:`)) {
          target_volume = parseFloat(c.status.split(':')[1]) || 0;
        }
        
        // Sum order volume for current month dynamically
        const customerOrders = (resOrders.data || []).filter((o: any) => {
          if (o.customer_id !== c.id) return false;
          const orderDate = new Date(o.created_at);
          const orderMonthStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          return orderMonthStr === currentMonthStr;
        });
        const total_order_volume = customerOrders.reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

        return {
          ...c,
          target_volume,
          total_order_volume
        };
      });
      setCustomers(customersWithTargets);
      setActivities(resActivity.data || []);
      if (resTargets.data) setSystemTargets(resTargets.data);
      setMasterAreas(resMA.data || []);
      setMasterCategories(resMC.data || []);
      setMasterChannels(resMCH.data || []);
      setMasterStatuses(resMS.data || []);
      setMasterActions(resMAC.data || []);
      setOrders(resOrders.data || []);
      setMasterProductCategories(resMPC.data || []);
      setMasterUnits(resMU.data || []);
      // resMA, resMC, resMCH, resMS, resMAC, resOrders are already handled
      // But I added a new fetch at the end of Promise.all, so I need to access it.
      // Promise.all order: resSales, resProspek, resCustomer, resActivity, resTargets, resMA, resMC, resMCH, resMS, resMAC, resOrders, resMPC
      // Wait, I should have updated the destructuring.

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_product_categories' }, () => debouncedFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_channels' }, () => debouncedFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_prospect_status' }, () => debouncedFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_actions' }, () => debouncedFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_units' }, () => debouncedFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => debouncedFetch())
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
    orders,
    systemTargets,
    masterAreas,
    masterCategories,
    masterProductCategories,
    masterChannels,
    masterStatuses,
    masterActions,
    masterUnits,
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
