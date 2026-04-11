/**
 * Standardized Area Definitions
 */
export const AREAS = [
  { id: 'A001', name: 'SMD' },
  { id: 'A002', name: 'BPN' },
  { id: 'A003', name: 'PJM' },
  { id: 'A004', name: 'SPK' },
  { id: 'A005', name: 'TNG' },
  { id: 'A006', name: 'BTG' },
  { id: 'A007', name: 'BK' },
] as const;

export type AreaId = typeof AREAS[number]['id'];

/**
 * Standardized Category Definitions (Kategori/Channel)
 */
export const CATEGORIES = [
  { id: 'K001', name: 'Retail' },
  { id: 'K002', name: 'Grosir' },
  { id: 'K003', name: 'Distributor' },
  { id: 'K004', name: 'Horeca' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

/**
 * Utility to get name from ID
 */
export const getAreaName = (id: string) => AREAS.find(a => a.id === id)?.name || id;
export const getCategoryName = (id: string) => CATEGORIES.find(k => k.id === id)?.name || id;
