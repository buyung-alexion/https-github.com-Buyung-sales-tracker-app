import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSave() {
  console.log('🧪 Testing Insert for Customer...');
  const testId = crypto.randomUUID();
  const { error: errC } = await supabase.from('customer').insert([{
    id: testId,
    nama_toko: 'TEST STORE CUSTOM',
    no_wa: '62811111111',
    area: 'CUSTOM-AREA-TEST',
    kategori: 'CUSTOM-CAT-TEST',
    tanggal_join: new Date().toISOString()
  }]);

  if (errC) {
    console.error('❌ Customer Insert Error:', errC);
  } else {
    console.log('✅ Customer Insert Success!');
    await supabase.from('customer').delete().eq('id', testId);
  }

  console.log('🧪 Testing Insert for Prospect...');
  const testPId = crypto.randomUUID();
  const { error: errP } = await supabase.from('prospek').insert([{
    id: testPId,
    nama_toko: 'TEST PROSPECT CUSTOM',
    nama_pic: (null as any) || 'Bpk/Ibu', // Simulate the fallback
    no_wa: '62822222222',
    area: 'CUSTOM-AREA-PROSPEK',
    kategori: 'CUSTOM-CAT-PROSPEK',
    channel: 'Canvasing',
    status: 'Cold'
  }]);

  if (errP) {
    console.error('❌ Prospect Insert Error:', errP);
  } else {
    console.log('✅ Prospect Insert Success!');
    await supabase.from('prospek').delete().eq('id', testPId);
  }
}

testSave();
