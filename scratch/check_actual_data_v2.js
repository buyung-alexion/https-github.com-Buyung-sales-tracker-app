
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xpveprqtfwvqaigeiniv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data: prospek, error: pError } = await supabase.from('prospek').select('id, nama_toko, status').limit(10);
  if (pError) console.error('P Error:', pError);
  console.log('Prospek Sample:', JSON.stringify(prospek, null, 2));
  
  const { data: customer, error: cError } = await supabase.from('customer').select('id, nama_toko, area').limit(10);
  if (cError) console.error('C Error:', cError);
  console.log('Customer Sample:', JSON.stringify(customer, null, 2));
}

checkData();
