import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1];
const supabaseAnonKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1];

if (!supabaseUrl || !supabaseAnonKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAll() {
  const tables = ['activity', 'sales', 'roles', 'system_targets', 'messages'];
  
  for (const table of tables) {
    console.log(`\n--- Checking ${table} Table ---`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`${table} error or not found:`, error.message);
    } else if (data?.[0]) {
      console.log(`Keys in ${table}:`, Object.keys(data[0]));
    } else {
      console.log(`${table} table empty, but reachable`);
    }
  }
}

checkAll();
