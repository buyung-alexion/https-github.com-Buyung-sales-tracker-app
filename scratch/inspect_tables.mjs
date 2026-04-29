import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function inspect() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const findEnv = (key) => {
    const match = env.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].replace(/["']/g, '').trim() : null;
  };
  
  const url = findEnv('VITE_SUPABASE_URL');
  const key = findEnv('VITE_SUPABASE_ANON_KEY');
  
  if (!url || !key) {
    console.error('Missing Supabase credentials in .env.local');
    return;
  }
  
  const supabase = createClient(url, key);
  
  const tables = ['customer', 'prospek', 'sales', 'orders', 'activity', 'attendance', 'roles', 'system_targets', 'master_areas', 'master_categories', 'master_channels', 'master_prospect_status', 'master_actions'];
  let output = '';
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      output += `Table ${table} error or not found: ${error.message}\n`;
    } else {
      output += `Table ${table} found! Columns: ${data.length > 0 ? Object.keys(data[0]).join(', ') : 'No data'}\n`;
    }
  }
  
  fs.writeFileSync('scratch/schema_output.txt', output);
  console.log('Done! Check scratch/schema_output.txt');
}

inspect();
