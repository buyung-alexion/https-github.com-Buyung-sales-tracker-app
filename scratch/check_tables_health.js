import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function check() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const findEnv = (key) => {
    const match = env.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].replace(/["']/g, '').trim() : null;
  };
  const supabase = createClient(findEnv('VITE_SUPABASE_URL'), findEnv('VITE_SUPABASE_ANON_KEY'));
  
  const tables = [
    'sales', 'prospek', 'customer', 'activity', 'system_targets', 
    'master_areas', 'master_categories', 'master_channels', 
    'master_prospect_status', 'master_actions'
  ];

  console.log('--- CHECKING ALL TABLES ---');
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`[FAIL] ${table}:`, error.message);
    } else {
      console.log(`[OK] ${table}`);
    }
  }
}

check();
