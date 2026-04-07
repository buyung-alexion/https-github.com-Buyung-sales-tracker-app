import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function verify() {
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const url = env.match(/VITE_SUPABASE_URL="(.*)"/)[1];
    const key = env.match(/VITE_SUPABASE_ANON_KEY="(.*)"/)[1];
    
    const supabase = createClient(url, key);
    
    console.log('--- Fetching Sales Users ---');
    const { data: users, error: fetchError } = await supabase.from('sales').select('*');
    
    if (fetchError) {
      console.error('Fetch Error:', fetchError);
      return;
    }
    
    console.log('Database Users found:', users.length);
    
    const buyung = users.find(u => u.username.toLowerCase() === 'buyung');
    
    if (buyung) {
      console.log(`Found user buyung (id: ${buyung.id}). Updating profile to Buyung / 12345678...`);
      const { error: updateError } = await supabase
        .from('sales')
        .update({ username: 'Buyung', password: '12345678' })
        .eq('id', buyung.id);
        
      if (updateError) {
        console.error('Update Error:', updateError);
      } else {
        console.log('Successfully updated Buyung credentials! 🎯');
      }
    } else {
      console.log('User buyung not found in DB. Creating new user...');
      const { error: insertError } = await supabase
        .from('sales')
        .insert([{ username: 'Buyung', password: '12345678', role: 'sales' }]);
      if (insertError) console.error('Insert Error:', insertError);
      else console.log('Successfully created Buyung user!');
    }
  } catch (err) {
    console.error('Script Error:', err);
  }
}

verify();
