const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xpveprqtfwvqaigeiniv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I');

async function check() {
  console.log("Fetching from activity...");
  const res = await supabase.from('activity').select('*').order('timestamp', { ascending: false });
  console.log("Error:", res.error);
  console.log("Data count:", res.data ? res.data.length : 0);
  if (res.error) {
     const res2 = await supabase.from('activity').select('*').limit(1);
     console.log("Without order error:", res2.error);
     console.log("Columns available:", res2.data && res2.data.length > 0 ? Object.keys(res2.data[0]) : "No data");
  }
}
check();
