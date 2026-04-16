import { useState } from 'react';
import { useSalesDataContext } from '../context/SalesDataContext';
import type { SystemTargets, Prospek, Customer, Activity, Sales, Area, StatusProspek, TipeAksi } from '../types';

export function useSalesData() {
  const context = useSalesDataContext();
  return context;
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

export type { SystemTargets, Prospek, Customer, Activity, Sales, Area, StatusProspek, TipeAksi };
