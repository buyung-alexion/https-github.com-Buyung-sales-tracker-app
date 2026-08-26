const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xpveprqtfwvqaigeiniv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I');

async function testAlias() {
  const res = await supabase.from('activity')
    .select('id, area:geotagging->area, lat:geotagging->lat, lng:geotagging->lng')
    .order('timestamp', { ascending: false })
    .limit(1);
  console.log('Error:', res.error);
  console.log('Data:', res.data);
}
testAlias();
