import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function check() {
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const url = env.match(/VITE_SUPABASE_URL="(.*)"/)[1];
    const key = env.match(/VITE_SUPABASE_ANON_KEY="(.*)"/)[1];
    
    const supabase = createClient(url, key);
    const { data, error } = await supabase.from('sales').select('username, role');
    
    if (error) {
      console.error(error);
    } else {
      console.log('--- DATABASE ROLES ---');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}

check();
