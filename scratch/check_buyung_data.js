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
  
  console.log('--- BUYUNG DATA CHECK ---');
  
  const { data: salesUsers } = await supabase.from('sales').select('*').ilike('nama', '%Buyung%');
  console.log('Sales Users matching "Buyung":', JSON.stringify(salesUsers, null, 2));
  
  if (salesUsers && salesUsers.length > 0) {
    const buyungId = salesUsers[0].id;
    console.log(`Checking data for ID: ${buyungId}`);
    
    const { count: actCount } = await supabase.from('activities').select('*', { count: 'exact', head: true }).eq('id_sales', buyungId);
    console.log(`Activity Count: ${actCount}`);
    
    const { count: prospekCount } = await supabase.from('prospek').select('*', { count: 'exact', head: true }).eq('sales_owner', buyungId);
    console.log(`Prospek Count: ${prospekCount}`);
    
    const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('sales_pic', buyungId);
    console.log(`Customer Count: ${customerCount}`);
  }
}

check();
