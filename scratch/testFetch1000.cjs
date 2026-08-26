const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xpveprqtfwvqaigeiniv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I');

async function testFetch1000() {
  const start = Date.now();
  const res = await supabase.from('activity').select('*').order('timestamp', { ascending: false }).limit(1000);
  console.log('Time:', Date.now() - start, 'ms');
  console.log('Error:', res.error);
  console.log('Count:', res.data ? res.data.length : 0);
}
testFetch1000();
