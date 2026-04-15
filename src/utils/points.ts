import type { Activity, Prospek, SystemTargets } from '../types';

export type FilterType = 'today' | 'week' | 'month' | 'all';

export interface PointsResult {
  totalActual: number;
  breakdown: {
    followup: number;
    order: number;
    visitProspek: number;
    visitCustomer: number;
    closing: number;
    newProspek: number;
  };
  filteredActs: Activity[];
}

/**
 * Normalizes point calculation across all screens (Homepage & Analytics).
 * Use this to ensure the "Poin Bulan Ini" is consistent.
 */
export function calculateSalesPoints(
  salesId: string,
  activities: Activity[],
  prospek: Prospek[],
  systemTargets: SystemTargets | null,
  filterType: FilterType = 'month'
): PointsResult {
  const now = new Date();
  
  // Date range logic
  const day = now.getDay() || 7;
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - day + 1);

  const isInRange = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (filterType === 'today') return d.toDateString() === now.toDateString();
    if (filterType === 'week') return d >= startOfWeek;
    if (filterType === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true; // for 'all'
  };

  // Filter Data
  const filteredActs = activities.filter(a => a.id_sales === salesId && isInRange(a.timestamp));
  const filteredProspek = prospek.filter(p => p.sales_owner === salesId && isInRange(p.created_at));

  // Count KPIs
  const followupCount = filteredActs.filter(a => a.tipe_aksi === 'WA' || a.tipe_aksi === 'Call').length;
  const soCount = filteredActs.filter(a => a.tipe_aksi === 'Order').length;
  const visitCount = filteredActs.filter(a => a.tipe_aksi === 'Visit' && a.target_type === 'prospek').length;
  const maintCount = filteredActs.filter(a => a.tipe_aksi === 'Visit' && a.target_type === 'customer').length;
  const closingCount = filteredActs.filter(a => a.catatan_hasil.toLowerCase().includes('closing')).length;
  const prospekCount = filteredProspek.length;

  // Weighing (Standardized from SystemTargets / Defaults)
  const weights = {
    chat: systemTargets?.b_chat ?? 1,
    order: systemTargets?.b_order ?? 5,
    visit: systemTargets?.b_visit ?? 5,
    maint: systemTargets?.b_maint ?? 5,
    closing: systemTargets?.b_closing ?? 20,
    prospek: systemTargets?.b_prospek ?? 5,
  };

  const totalActual = 
    (followupCount * weights.chat) +
    (soCount * weights.order) +
    (visitCount * weights.visit) +
    (maintCount * weights.maint) +
    (closingCount * weights.closing) +
    (prospekCount * weights.prospek);

  return {
    totalActual,
    breakdown: {
      followup: followupCount,
      order: soCount,
      visitProspek: visitCount,
      visitCustomer: maintCount,
      closing: closingCount,
      newProspek: prospekCount
    },
    filteredActs
  };
}
