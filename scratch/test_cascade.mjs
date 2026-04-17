import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envPath = '.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkCascade() {
  console.log('Testing ID Update Cascade...');
  
  // 1. Create a dummy sales record
  const dummyId = 'TEST_OLD';
  const newId = 'TEST_NEW';
  
  await supabase.from('sales').insert([{ id: dummyId, nama: 'Test User', username: 'testuser', password: '123' }]);
  
  // 2. Create a dummy activity linked to it
  await supabase.from('activity').insert([{ 
    id: crypto.randomUUID(), 
    id_sales: dummyId, 
    target_id: 'dummy', 
    target_type: 'area', 
    target_nama: 'Test', 
    tipe_aksi: 'Note', 
    catatan_hasil: 'Test Cascade' 
  }]);
  
  console.log('Attempting to update sales.id from TEST_OLD to TEST_NEW...');
  const { error } = await supabase.from('sales').update({ id: newId }).eq('id', dummyId);
  
  if (error) {
    console.log('Update failed:', error.message);
    if (error.message.includes('foreign key constraint')) {
      console.log('RESULT: ON UPDATE CASCADE is NOT enabled.');
    }
  } else {
    // Check if activity was updated
    const { data: acts } = await supabase.from('activity').select('*').eq('id_sales', newId);
    if (acts && acts.length > 0) {
      console.log('RESULT: ON UPDATE CASCADE IS ENABLED!');
    } else {
      console.log('RESULT: Update succeeded but related records were NOT updated (Orphaned).');
    }
  }
  
  // Cleanup
  await supabase.from('activity').delete().eq('id_sales', newId);
  await supabase.from('sales').delete().eq('id', newId);
  await supabase.from('sales').delete().eq('id', dummyId);
  
  process.exit(0);
}

checkCascade();
