import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function verify() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const findEnv = (key) => {
    const match = env.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].replace(/["']/g, '').trim() : null;
  };
  
  const url = findEnv('VITE_SUPABASE_URL');
  const key = findEnv('VITE_SUPABASE_ANON_KEY');
  
  const supabase = createClient(url, key);
  
  console.log('--- Prospek Keys ---');
  const { data: prospek, error: pe } = await supabase.from('prospek').select('*').limit(1);
  if (pe) console.error(pe);
  else if (prospek.length > 0) console.log(Object.keys(prospek[0]));
  else console.log('Prospek is empty, cannot easily infer keys unless we query information_schema, but we rely on data here.');

  console.log('--- Customer Keys ---');
  const { data: customer, error: ce } = await supabase.from('customer').select('*').limit(1);
  if (ce) console.error(ce);
  else if (customer.length > 0) console.log(Object.keys(customer[0]));
  else console.log('Customer is empty');
}

verify();
