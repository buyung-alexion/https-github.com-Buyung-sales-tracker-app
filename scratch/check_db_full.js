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
  
  console.log('--- DATABASE SCHEMA CHECK ---');
  
  const { data: prospeks } = await supabase.from('prospek').select('id, nama_toko, sales_owner');
  console.log('Prospek entries:', prospeks?.length);
  if (prospeks) prospeks.slice(0, 5).forEach(p => console.log(`Prospek: ${p.nama_toko}, Owner: ${p.sales_owner}`));
  
  const { data: sales } = await supabase.from('sales').select('id, nama');
  console.log('Sales entries:', sales?.length);
  if (sales) sales.slice(0, 10).forEach(s => console.log(`Sales: ${s.nama}, ID: ${s.id}`));
  
  const { data: customers } = await supabase.from('customer').select('id, nama_toko, sales_pic');
  console.log('Customer entries:', customers?.length);
  if (customers) customers.slice(0, 5).forEach(c => console.log(`Customer: ${c.nama_toko}, PIC: ${c.sales_pic}`));
}

check();
