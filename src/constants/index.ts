/**
 * Standardized Master Data Utilities
 * 
 * Note: AREAS, CATEGORIES, and CHANNELS constants have been DEPRECATED.
 * All master data should now be consumed from Supabase via:
 * const { masterAreas, masterCategories, masterChannels } = useSalesData();
 */

/**
 * Utility to get name from ID (using the ID as fallback)
 * These helpers are kept for legacy compatibility but should be used sparingly.
 */
export const getAreaName = (id: string) => id;
export const getCategoryName = (id: string) => id;
export const getChannelName = (id: string) => id;
