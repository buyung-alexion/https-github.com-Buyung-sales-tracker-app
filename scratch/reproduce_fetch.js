import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function check() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const findEnv = (key) => {
    const match = env.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].replace(/["']/g, '').trim() : null;
  };
  
  const url = findEnv('VITE_SUPABASE_URL');
  const key = findEnv('VITE_SUPABASE_ANON_KEY');
  
  const supabase = createClient(url, key);
  
  console.log('--- REPRODUCING DATA FETCH ---');
  
  const resProspek = await supabase.from('prospek').select('*').order('created_at', { ascending: false });
  console.log('Prospek result count:', resProspek.data?.length);
  if (resProspek.error) console.log('Prospek error:', resProspek.error);

  const resCustomer = await supabase.from('customer').select('*').order('tanggal_join', { ascending: false });
  console.log('Customer (singular) result count:', resCustomer.data?.length);
  if (resCustomer.error) console.log('Customer (singular) error:', resCustomer.error);

  const resActivity = await supabase.from('activity').select('*').order('timestamp', { ascending: false });
  console.log('Activity (singular) result count:', resActivity.data?.length);
  if (resActivity.error) console.log('Activity (singular) error:', resActivity.error);

  const resActivityPlural = await supabase.from('activities').select('*').order('timestamp', { ascending: false });
  console.log('Activities (plural) result count:', resActivityPlural.data?.length);
  if (resActivityPlural.error) console.log('Activities (plural) error:', resActivityPlural.error);

  const resCustomerPlural = await supabase.from('customers').select('*').order('tanggal_join', { ascending: false });
  console.log('Customers (plural) result count:', resCustomerPlural.data?.length);
  if (resCustomerPlural.error) console.log('Customers (plural) error:', resCustomerPlural.error);
}

check();
