import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xpveprqtfwvqaigeiniv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCols() {
  const { data, error } = await supabase.from('customer').select('*').limit(1);
  if (error) {
    console.error('Error fetching customer:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Customer columns:', Object.keys(data[0]));
  } else {
    console.log('No customer data found to check columns.');
  }
  
  const { data: pData, error: pError } = await supabase.from('prospek').select('*').limit(1);
  if (pError) {
    console.error('Error fetching prospek:', pError);
    return;
  }
  if (pData && pData.length > 0) {
    console.log('Prospek columns:', Object.keys(pData[0]));
  } else {
    console.log('No prospek data found to check columns.');
  }
}

checkCols();
