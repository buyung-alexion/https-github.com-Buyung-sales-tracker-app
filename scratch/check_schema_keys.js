import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function check() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const findEnv = (key) => {
    const match = env.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].replace(/["']/g, '').trim() : null;
  };
  const supabase = createClient(findEnv('VITE_SUPABASE_URL'), findEnv('VITE_SUPABASE_ANON_KEY'));
  
  const { data: customer } = await supabase.from('customer').select('*').limit(1).single();
  console.log('--- CUSTOMER KEYS ---');
  console.log(Object.keys(customer || {}));
  console.log(customer);

  const { data: activity } = await supabase.from('activity').select('*').limit(1).single();
  console.log('--- ACTIVITY KEYS ---');
  console.log(Object.keys(activity || {}));
  console.log(activity);

  const { data: prospek } = await supabase.from('prospek').select('*').limit(1).single();
  console.log('--- PROSPEK KEYS ---');
  console.log(Object.keys(prospek || {}));
  console.log(prospek);
}

check();
