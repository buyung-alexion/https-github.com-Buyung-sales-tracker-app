
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCleanup() {
  console.log('Verifying data cleanup...');

  // 1. Check for demo sales
  const { data: demoSales } = await supabase
    .from('sales')
    .select('*')
    .or('nama.ilike.%demo%,nama.ilike.%ppin%,nama.ilike.%erlan%,nama.ilike.%nanda%');

  if (demoSales && demoSales.length > 0) {
    console.log('Found remaining demo sales:', demoSales.map(s => s.nama));
  } else {
    console.log('No demo sales found. OK.');
  }

  // 2. Check for demo prospek
  const { data: demoProspek } = await supabase
    .from('prospek')
    .select('*')
    .or('nama_toko.ilike.%demo%');

  if (demoProspek && demoProspek.length > 0) {
    console.log('Found remaining demo prospek:', demoProspek.map(p => p.nama_toko));
  } else {
    console.log('No demo prospek found. OK.');
  }

  // 3. Check for demo customers
  const { data: demoCustomers } = await supabase
    .from('customer')
    .select('*')
    .or('name.ilike.%demo%');

  if (demoCustomers && demoCustomers.length > 0) {
    console.log('Found remaining demo customers:', demoCustomers.map(c => c.name));
  } else {
    console.log('No demo customers found. OK.');
  }

  console.log('Cleanup verification complete.');
}

verifyCleanup();
