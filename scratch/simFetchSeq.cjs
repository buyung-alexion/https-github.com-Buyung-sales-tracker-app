const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xpveprqtfwvqaigeiniv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I');

async function test() {
  try {
      console.log('Fetching core data...');
      const [resSales, resProspek] = await Promise.all([
        supabase.from('sales').select('*').order('id'),
        supabase.from('prospek').select('*').order('created_at', { ascending: false }).limit(1000)
      ]);
      console.log('Core done. Fetching activity...');
      
      const start = Date.now();
      const resActivity = await supabase.from('activity').select('*').order('timestamp', { ascending: false }).limit(100);
      console.log('Activity fetch time:', Date.now() - start, 'ms');
      console.log('Activity Error:', resActivity.error);
      console.log('Activity count:', resActivity.data ? resActivity.data.length : 0);
  } catch(e) {
      console.error('ERROR:', e);
  }
}
test();
