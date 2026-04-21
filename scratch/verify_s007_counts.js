import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function check() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const findEnv = (key) => {
    const match = env.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].replace(/["']/g, '').trim() : null;
  };
  const supabase = createClient(findEnv('VITE_SUPABASE_URL'), findEnv('VITE_SUPABASE_ANON_KEY'));
  
  const { count: cCust } = await supabase.from('customer').select('*', { count: 'exact', head: true }).eq('sales_pic', 'S007');
  const { count: cPros } = await supabase.from('prospek').select('*', { count: 'exact', head: true }).eq('sales_owner', 'S007');
  const { count: cAct } = await supabase.from('activity').select('*', { count: 'exact', head: true }).eq('id_sales', 'S007');

  console.log('--- S007 DATA COUNTS ---');
  console.log('Customers:', cCust);
  console.log('Prospects:', cPros);
  console.log('Activities:', cAct);
}

check();
