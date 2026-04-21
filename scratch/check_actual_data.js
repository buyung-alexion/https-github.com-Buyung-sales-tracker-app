
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkData() {
  const { data: prospek, error: pError } = await supabase.from('prospek').select('id, nama_toko, status').limit(5);
  console.log('Prospek Sample:', prospek);
  
  const { data: customer, error: cError } = await supabase.from('customer').select('id, nama_toko, area').limit(5);
  console.log('Customer Sample:', customer);
}

checkData();
