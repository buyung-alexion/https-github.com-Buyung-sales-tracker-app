export function getUniqueOptions(data: any[], field: string, constants: readonly (string | { id: string })[]): string[] {
  // Extract IDs if constants are objects
  const baseValues = constants.map(c => typeof c === 'string' ? c : c.id);
  
  if (!data) return baseValues;
  
  const existingValues = data
    .map(item => item[field])
    .filter(val => val && typeof val === 'string' && val.trim() !== '');
    
  // Combine, deduplicate, and sort
  const combined = Array.from(new Set([...baseValues, ...existingValues]));
  return combined.sort((a, b) => a.localeCompare(b));
}
