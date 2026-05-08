import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log('Checking leads_negotiations data...');
  const { data, error } = await supabase
    .from('leads_negotiations')
    .select('id, sales_id, customer_name, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} recent negotiations:`);
  data.forEach(n => {
    console.log(`- ID: ${n.id} | SalesID: ${n.sales_id} | Cust: ${n.customer_name} | Date: ${n.created_at}`);
  });

  const { count } = await supabase
    .from('leads_negotiations')
    .select('*', { count: 'exact', head: true });
    
  console.log(`\nTotal negotiations in DB: ${count}`);
}

check();
