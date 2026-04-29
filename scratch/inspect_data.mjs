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
  
  const supabase = createClient(url, key);
  
  const { data: activities } = await supabase.from('activity').select('*').limit(5);
  console.log('Activities:', activities);
  
  const { data: customers } = await supabase.from('customer').select('*').limit(5);
  console.log('Customers:', customers);
}

inspect();
