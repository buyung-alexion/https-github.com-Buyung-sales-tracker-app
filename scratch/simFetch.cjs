const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xpveprqtfwvqaigeiniv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I');

async function test() {
  try {
      const [resSales, resProspek, resCustomer, resActivity, resTargets, resMA, resMC, resMCH, resMS, resMAC, resOrders, resMPC, resMU] = await Promise.all([
        supabase.from('sales').select('*').order('id'),
        supabase.from('prospek').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('customer').select('*').order('tanggal_join', { ascending: false }).limit(1000),
        supabase.from('activity').select('*').order('timestamp', { ascending: false }).limit(1000),
        supabase.from('system_targets').select('*').eq('id', 1).maybeSingle(), 
        supabase.from('master_areas').select('*').order('name'),
        supabase.from('master_categories').select('*').order('name'),
        supabase.from('master_channels').select('*').order('name'),
        supabase.from('master_prospect_status').select('*').order('name'),
        supabase.from('master_actions').select('*').order('name'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('master_product_categories').select('*').order('name'),
        supabase.from('master_units').select('*').order('name')
      ]);

      console.log('Activity Error:', resActivity.error);
      console.log('Activity Data Count:', resActivity.data ? resActivity.data.length : 0);
      console.log('Orders Error:', resOrders.error);
      console.log('Targets Error:', resTargets.error);
  } catch(e) {
      console.error('CAUGHT JS ERROR:', e);
  }
}
test();
