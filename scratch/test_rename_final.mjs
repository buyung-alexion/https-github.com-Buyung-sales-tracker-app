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

async function testRename() {
  console.log('--- Testing ID Rename functionality ---');
  
  const oldId = 'RENAME_ME';
  const newId = 'RENAMED_SUCCESS';
  
  // 1. Setup
  console.log('1. Creating test user ' + oldId);
  await supabase.from('sales').insert([{ id: oldId, nama: 'Rename Test', username: 'renametest', password: '123' }]);
  await supabase.from('activity').insert([{ 
    id: crypto.randomUUID(), id_sales: oldId, target_id: 'dummy', target_type: 'area', target_nama: 'Test', tipe_aksi: 'Note', catatan_hasil: 'Old ID Activity' 
  }]);

  // 2. Perform Rename (using the logic in updateSales)
  console.log('2. Updating ID to ' + newId);
  const updates = { id: newId, nama: 'Renamed User' };
  const { data, error } = await supabase.from('sales').update(updates).eq('id', oldId).select();
  
  if (error) {
    console.error('Rename failed! Error:', error.message);
    console.log('IMPORTANT: This might mean "ON UPDATE CASCADE" is not yet enabled in Supabase.');
  } else {
    console.log('Rename successful! Rows updated:', data?.length);
    
    // 3. Verify activity
    const { data: acts } = await supabase.from('activity').select('*').eq('id_sales', newId);
    if (acts && acts.length > 0) {
      console.log('Verification Success: Activity history MIGRATED to ' + newId);
    } else {
      console.log('Verification Failed: Activity history did NOT migrate.');
    }
  }

  // 4. Cleanup
  console.log('4. Cleaning up...');
  await supabase.from('activity').delete().eq('id_sales', newId);
  await supabase.from('activity').delete().eq('id_sales', oldId);
  await supabase.from('sales').delete().eq('id', newId);
  await supabase.from('sales').delete().eq('id', oldId);
  
  process.exit(0);
}

testRename();
