
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xpveprqtfwvqaigeiniv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('sales').select('id');
  if (error) {
    console.error('Error fetching ids:', error);
  } else {
    console.log('All Sales IDs:', data.map(s => s.id));
  }
}

check();
