import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function inspect() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const findEnv = (key) => {
    const match = env.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].replace(/["']/g, '').trim() : null;
  };
  
  const url = findEnv('VITE_SUPABASE_URL');
  const key = findEnv('VITE_SUPABASE_ANON_KEY');
  
  const supabase = createClient(url, key);
  
  const { data: settings, error: sError } = await supabase.from('payroll_settings').select('*');
  console.log('Payroll Settings:', settings, sError);
  
  const { data: area_rates, error: aError } = await supabase.from('area_rates').select('*');
  console.log('Area Rates:', area_rates, aError);
}

inspect();
