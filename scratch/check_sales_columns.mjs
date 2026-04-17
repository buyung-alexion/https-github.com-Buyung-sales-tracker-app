import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local manually
const envPath = '.env.local';
if (!fs.existsSync(envPath)) {
  console.error('.env.local not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching columns from "sales" table...');
  const { data, error } = await supabase.from('sales').select('*').limit(1);
  
  if (error) {
    console.error('Supabase error:', error);
  } else if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
    console.log('Complete Sample Row:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('Table "sales" is empty.');
  }
  process.exit(0);
}

run();
