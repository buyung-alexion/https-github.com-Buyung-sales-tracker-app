import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function verify() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const findEnv = (key) => {
    const match = env.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].replace(/["']/g, '').trim() : null;
  };
  
  const url = findEnv('VITE_SUPABASE_URL');
  const key = findEnv('VITE_SUPABASE_ANON_KEY');
  
  if (!url || !key) {
    console.error('Missing Supabase credentials in .env.local');
    return;
  }
  
  const supabase = createClient(url, key);
  
  console.log('--- Fetching Sales Users ---');
  const { data: users, error: fetchError } = await supabase.from('sales').select('*');
  
  if (fetchError) {
    console.error('Fetch Error:', fetchError);
    return;
  }
  
  console.log('Database Users:', JSON.stringify(users, null, 2));
  
  const buyung = users.find(u => u.username.toLowerCase() === 'buyung');
  
  if (buyung) {
    console.log('Found user buyung. Updating password to 12345678...');
    const { error: updateError } = await supabase
      .from('sales')
      .update({ username: 'Buyung', password: '12345678' })
      .eq('id', buyung.id);
      
    if (updateError) {
      console.error('Update Error:', updateError);
    } else {
      console.log('Successfully updated Buyung credentials!');
    }
  } else {
    console.log('User buyung not found in DB.');
  }
}

verify();
