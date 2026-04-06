import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load env from .env.local
const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1];
const supabaseAnonKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('--- Checking Prospek Table ---');
  const { data: p, error: ep } = await supabase.from('prospek').select('*').limit(1);
  if (ep) console.error(ep);
  else if (p?.[0]) console.log('Keys in Prospek:', Object.keys(p[0]));
  else console.log('Prospek table empty, but reachable');

  console.log('\n--- Checking Customer Table ---');
  const { data: c, error: ec } = await supabase.from('customer').select('*').limit(1);
  if (ec) console.error(ec);
  else if (c?.[0]) console.log('Keys in Customer:', Object.keys(c[0]));
  else console.log('Customer table empty, but reachable');
}

check();
