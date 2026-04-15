import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('🔍 Verifying Supabase Data...');

  const { data: customers } = await supabase.from('customer').select('area, kategori').limit(10);
  console.log('Customer Samples:', customers);

  const { data: prospects } = await supabase.from('prospek').select('area, kategori').limit(5);
  console.log('Prospect Samples:', prospects);

  const { data: activities } = await supabase.from('activity').select('target_nama, geotagging').filter('tipe_aksi', 'eq', 'Visit').limit(5);
  console.log('Activity (Visit) Samples:', activities);

  console.log('Done.');
}
verify();
