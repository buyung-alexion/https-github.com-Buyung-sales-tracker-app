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

async function getConstraints() {
  console.log('Querying constraint names for "sales" references...');
  
  const query = `
    SELECT
        tc.table_name, 
        kcu.column_name, 
        tc.constraint_name
    FROM 
        information_schema.table_constraints AS tc 
    JOIN 
        information_schema.key_column_usage AS kcu 
        ON tc.constraint_name = kcu.constraint_name 
    WHERE 
        tc.constraint_type = 'FOREIGN KEY' 
        AND kcu.referenced_table_name = 'sales';
  `;

  // We can't run arbitrary SQL easily via Supabase Client without an RPC.
  // I'll try to check by looking at the errors if I try to delete a record.
  
  const tables = ['activity', 'attendance', 'prospek', 'customer'];
  console.log('Checking tables:', tables);
  
  process.exit(0);
}

getConstraints();
