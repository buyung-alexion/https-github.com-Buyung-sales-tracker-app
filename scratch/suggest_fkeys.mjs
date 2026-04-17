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

async function findConstraints() {
  console.log('--- Finding Constraint Names ---');
  // Since we can't run raw SQL easily via JS Client without a predefined RPC,
  // I will just suggest the most common ones and explain how to find them.
  console.log('Common names to try:');
  console.log('1. activity_id_sales_fkey');
  console.log('2. activity_sales_id_fkey');
  console.log('3. attendance_sales_id_fkey');
  console.log('4. prospek_sales_owner_fkey');
  console.log('5. customer_sales_pic_fkey');
  
  process.exit(0);
}

findConstraints();
