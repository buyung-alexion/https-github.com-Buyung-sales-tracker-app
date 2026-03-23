import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Prospek, Customer, Activity, Sales, Area, StatusProspek, TipeAksi, Armada, PlanBesok } from '../types';

export function useSalesData() {
  const [sales, setSales] = useState<Sales[]>([]);
  const [prospek, setProspek] = useState<Prospek[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [planBesok, setPlanBesok] = useState<PlanBesok[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [resSales, resProspek, resCustomer, resActivity, resPlan] = await Promise.all([
        supabase.from('sales').select('*').order('id'),
        supabase.from('prospek').select('*').order('created_at', { ascending: false }),
        supabase.from('customer').select('*').order('tanggal_join', { ascending: false }),
        supabase.from('activity').select('*').order('timestamp', { ascending: false }),
        supabase.from('plan_besok').select('*').order('tanggal_rencana', { ascending: true }),
      ]);

      setSales(resSales.data || []);
      setProspek(resProspek.data || []);
      setCustomers(resCustomer.data || []);
      setActivities(resActivity.data || []);
      setPlanBesok(resPlan.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to all changes on the public schema
    const channel = supabase.channel('st_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prospek' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_besok' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refresh = fetchData; // Keep backward compatibility for components manually refreshing

  return { sales, prospek, customers, activities, planBesok, loading, refresh };
}

export function useCurrentSales() {
  const [currentSalesId, setCurrentSalesId] = useState<string>(() => {
    return localStorage.getItem('st_current_sales') || '';
  });

  const { sales } = useSalesData();

  const setSales = (id: string) => {
    localStorage.setItem('st_current_sales', id);
    setCurrentSalesId(id);
  };

  const salesData = sales.find(s => s.id === currentSalesId);

  return { currentSalesId, setSales, salesData };
}

export type { Prospek, Customer, Activity, Sales, Area, StatusProspek, TipeAksi, Armada, PlanBesok };
