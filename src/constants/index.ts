/**
 * Standardized Area Definitions
 * Now using the shorthand name as the ID (ID == Name) as per user request.
 */
export const AREAS = [
  { id: 'SMD', name: 'SMD' },
  { id: 'BPN', name: 'BPN' },
  { id: 'PJM', name: 'PJM' },
  { id: 'SPK', name: 'SPK' },
  { id: 'TNG', name: 'TNG' },
  { id: 'BTG', name: 'BTG' },
  { id: 'BK', name: 'BK' },
] as const;

export type AreaId = typeof AREAS[number]['id'];

/**
 * Standardized Category Definitions (Kategori/Channel)
 * Now using the name as the ID (ID == Name) as per user request.
 */
export const CATEGORIES = [
  { id: 'Retail', name: 'Retail' },
  { id: 'Grosir', name: 'Grosir' },
  { id: 'Distributor', name: 'Distributor' },
  { id: 'Horeca', name: 'Horeca' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

/**
 * Utility to get name from ID
 */
export const getAreaName = (id: string) => AREAS.find(a => a.id === id)?.name || id;
export const getCategoryName = (id: string) => CATEGORIES.find(k => k.id === id)?.name || id;
