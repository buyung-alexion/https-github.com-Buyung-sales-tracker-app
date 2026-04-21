import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function check() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const findEnv = (key) => {
    const match = env.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].replace(/["']/g, '').trim() : null;
  };
  const supabase = createClient(findEnv('VITE_SUPABASE_URL'), findEnv('VITE_SUPABASE_ANON_KEY'));
  
  const { data: customers } = await supabase.from('customer').select('sales_pic').limit(10);
  console.log('--- CUSTOMER sales_pic samples ---');
  customers?.forEach(c => console.log(`'${c.sales_pic}' (length: ${c.sales_pic?.length})`));

  const { data: prospek } = await supabase.from('prospek').select('sales_owner').limit(10);
  console.log('--- PROSPEK sales_owner samples ---');
  prospek?.forEach(p => console.log(`'${p.sales_owner}' (length: ${p.sales_owner?.length})`));

  const { data: sales } = await supabase.from('sales').select('id').eq('nama', 'Buyung');
  console.log('--- BUYUNG ID ---');
  sales?.forEach(s => console.log(`'${s.id}' (length: ${s.id?.length})`));
}

check();
