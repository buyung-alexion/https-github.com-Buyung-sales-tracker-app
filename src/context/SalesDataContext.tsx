import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { SystemTargets, Prospek, Customer, Activity, Sales, SalesOrder } from '../types';

const loadCache = (key: string, defaultVal: any) => {
  try {
    const cached = localStorage.getItem(`st_cache_${key}`);
    return cached ? JSON.parse(cached) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

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
  const [sales, setSales] = useState<Sales[]>(() => loadCache('sales', []));
  const [allSales, setAllSales] = useState<Sales[]>(() => loadCache('allSales', []));
  const [prospek, setProspek] = useState<Prospek[]>(() => loadCache('prospek', []));
  const [customers, setCustomers] = useState<Customer[]>(() => loadCache('customers', []));
  const [activities, setActivities] = useState<Activity[]>(() => loadCache('activities', []));
  const [orders, setOrders] = useState<SalesOrder[]>(() => loadCache('orders', []));
  const [systemTargets, setSystemTargets] = useState<SystemTargets | null>(() => loadCache('systemTargets', null));
  const [masterAreas, setMasterAreas] = useState<{id: string, name: string}[]>(() => loadCache('masterAreas', []));
  const [masterCategories, setMasterCategories] = useState<{id: string, name: string}[]>(() => loadCache('masterCategories', []));
  const [masterProductCategories, setMasterProductCategories] = useState<{id: string, name: string}[]>(() => loadCache('masterProductCategories', []));
  const [masterChannels, setMasterChannels] = useState<{id: string, name: string}[]>(() => loadCache('masterChannels', []));
  const [masterStatuses, setMasterStatuses] = useState<{id: string, name: string}[]>(() => loadCache('masterStatuses', []));
  const [masterActions, setMasterActions] = useState<{id: string, name: string}[]>(() => loadCache('masterActions', []));
  const [masterUnits, setMasterUnits] = useState<{id: string, name: string}[]>(() => loadCache('masterUnits', []));
  const [loading, setLoading] = useState(() => {
    const hasCache = localStorage.getItem('st_cache_customers');
    return !hasCache; // if we have cache, don't show loading overlay
  });
  const fetchTimeoutRef = React.useRef<any>(null);

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Master Data & Core Tables (Small/Medium size)
      const [resSales, resProspek, resCustomer, resTargets, resMA, resMC, resMCH, resMS, resMAC, resMPC, resMU] = await Promise.all([
        supabase.from('sales').select('*').order('id'),
        supabase.from('prospek').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('customer').select('*').order('tanggal_join', { ascending: false }).limit(1000),
        supabase.from('system_targets').select('*').eq('id', 1).maybeSingle(), 
        supabase.from('master_areas').select('*').order('name'),
        supabase.from('master_categories').select('*').order('name'),
        supabase.from('master_channels').select('*').order('name'),
        supabase.from('master_prospect_status').select('*').order('name'),
        supabase.from('master_actions').select('*').order('name'),
        supabase.from('master_product_categories').select('*').order('name'),
        supabase.from('master_units').select('*').order('name')
      ]);

      // 2. Fetch Large Transactional Tables Separately (Prevents Timeout)
      // Fetch up to 2000 activities without the heavy photo data
      const resActivity = await supabase.from('activity')
        .select('id, id_sales, target_id, target_type, target_nama, tipe_aksi, catatan_hasil, timestamp, sales_name, area:geotagging->area, lat:geotagging->lat, lng:geotagging->lng')
        .order('timestamp', { ascending: false })
        .limit(2000);
      const resOrders = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500);

      // Logging for diagnostics (useful during deployment validation)
      if (resCustomer.error) console.error('Customer fetch error:', resCustomer.error);
      if (resProspek.error) console.error('Prospek fetch error:', resProspek.error);
      if (resActivity.error) console.error('Activity fetch error:', resActivity.error);
      if (resOrders.error) console.error('Orders fetch error:', resOrders.error);

      const allSalesData = resSales.data || [];
      const salesOnly = allSalesData.filter(s => (s.role || '').toLowerCase() === 'sales');
      
      setSales(salesOnly);
      localStorage.setItem('st_cache_sales', JSON.stringify(salesOnly));
      
      setAllSales(allSalesData);
      localStorage.setItem('st_cache_allSales', JSON.stringify(allSalesData));
      
      setProspek(resProspek.data || []);
      localStorage.setItem('st_cache_prospek', JSON.stringify(resProspek.data || []));
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
      localStorage.setItem('st_cache_customers', JSON.stringify(customersWithTargets));
      
      if (resActivity.data) {
        // Map back the aliased geotagging fields so the app structure doesn't break
        const optimizedActivities = resActivity.data.map((a: any) => ({
          ...a,
          geotagging: {
            area: a.area,
            lat: a.lat,
            lng: a.lng
          }
        }));
        setActivities(optimizedActivities);
        localStorage.setItem('st_cache_activities', JSON.stringify(optimizedActivities));
      }
      
      if (resTargets.data) {
        setSystemTargets(resTargets.data);
        localStorage.setItem('st_cache_systemTargets', JSON.stringify(resTargets.data));
      }
      
      setMasterAreas(resMA.data || []);
      localStorage.setItem('st_cache_masterAreas', JSON.stringify(resMA.data || []));
      
      setMasterCategories(resMC.data || []);
      localStorage.setItem('st_cache_masterCategories', JSON.stringify(resMC.data || []));
      
      setMasterChannels(resMCH.data || []);
      localStorage.setItem('st_cache_masterChannels', JSON.stringify(resMCH.data || []));
      
      setMasterStatuses(resMS.data || []);
      localStorage.setItem('st_cache_masterStatuses', JSON.stringify(resMS.data || []));
      
      setMasterActions(resMAC.data || []);
      localStorage.setItem('st_cache_masterActions', JSON.stringify(resMAC.data || []));
      
      if (resOrders.data) {
        setOrders(resOrders.data);
        localStorage.setItem('st_cache_orders', JSON.stringify(resOrders.data));
      }
      
      setMasterProductCategories(resMPC.data || []);
      localStorage.setItem('st_cache_masterProductCategories', JSON.stringify(resMPC.data || []));
      
      setMasterUnits(resMU.data || []);
      localStorage.setItem('st_cache_masterUnits', JSON.stringify(resMU.data || []));

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

    // [NEW] Local custom event listener for local state refresh
    const handleLocalRefresh = () => debouncedFetch();
    window.addEventListener('st_data_changed', handleLocalRefresh);

    const channel = supabase.channel('st_global_realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => debouncedFetch())
      .subscribe();

    return () => {
      // [NEW] Hapus listener saat komponen unmount
      window.removeEventListener('st_data_changed', handleLocalRefresh);
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
