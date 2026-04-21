
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xpveprqtfwvqaigeiniv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I";
const supabase = createClient(supabaseUrl, supabaseKey);

async function repairStatus() {
  console.log('--- START REPAIR STATUS ---');
  
  // Set any status that is exactly "001" to "Cold"
  const { data, error } = await supabase
    .from('prospek')
    .update({ status: 'Cold' })
    .eq('status', '001')
    .select();

  if (error) {
    console.error('Repair failed:', error);
  } else {
    console.log(`Successfully repaired ${data?.length || 0} prospect records.`);
  }
}

repairStatus();
