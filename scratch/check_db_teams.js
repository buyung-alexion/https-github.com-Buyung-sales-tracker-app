
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xpveprqtfwvqaigeiniv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('roles').select('*');
  if (error) {
    console.error('Error fetching roles:', error);
  } else {
    console.log('Roles in DB:', data);
    console.log('Total roles:', data?.length || 0);
  }

  const { data: sales, error: errorS } = await supabase.from('sales').select('*');
  if (errorS) {
    console.error('Error fetching sales:', errorS);
  } else {
    console.log('Total sales:', sales?.length || 0);
  }
}

check();
