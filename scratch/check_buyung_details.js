import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function check() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const findEnv = (key) => {
    const match = env.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].replace(/["']/g, '').trim() : null;
  };
  const supabase = createClient(findEnv('VITE_SUPABASE_URL'), findEnv('VITE_SUPABASE_ANON_KEY'));
  
  const { data: sales, error } = await supabase.from('sales').select('*').eq('id', 'S007').single();
  console.log('--- BUYUNG DETAILS ---');
  console.log(sales);
  if (error) console.log('Error:', error.message);
}

check();
