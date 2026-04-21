
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xpveprqtfwvqaigeiniv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I";
const supabase = createClient(supabaseUrl, supabaseKey);

async function dryRun() {
  console.log('--- START DRY RUN ---');
  
  try {
    const { data: p, error: pErr } = await supabase.from('prospek').select('id, nama_toko, created_at').order('created_at', { ascending: true });
    if (pErr) throw pErr;
    
    const { data: c, error: cErr } = await supabase.from('customer').select('id, nama_toko, tanggal_join').order('tanggal_join', { ascending: true });
    if (cErr) throw cErr;
    
    const { data: a, error: aErr } = await supabase.from('activity').select('id, target_id, target_nama');
    if (aErr) throw aErr;

    console.log(`Found ${p.length} prospects, ${c.length} customers, ${a.length} activities.`);

    const pMap = {};
    p.forEach((item, index) => {
      if (item.id) {
        pMap[item.id] = `P${(index + 1).toString().padStart(3, '0')}`;
      }
    });

    const cMap = {};
    c.forEach((item, index) => {
      if (item.id) {
        cMap[item.id] = `C${(index + 1).toString().padStart(3, '0')}`;
      }
    });

    console.log('\nProspect Mapping (First 5):');
    p.slice(0, 5).forEach(item => {
      console.log(`${item.id.substring(0, 8)}... -> ${pMap[item.id]} (${item.nama_toko})`);
    });

    console.log('\nCustomer Mapping (First 5):');
    c.slice(0, 5).forEach(item => {
      console.log(`${item.id.substring(0, 8)}... -> ${cMap[item.id]} (${item.nama_toko})`);
    });

    let orphans = 0;
    a.forEach(act => {
      if (act.target_id && !pMap[act.target_id] && !cMap[act.target_id]) {
         // Some target_ids might be UUIDs that don't match or empty
         orphans++;
      }
    });

    console.log(`\nActivities analysis: ${orphans} activities have target_ids not matching any current prospect or customer.`);
  } catch (err) {
    console.error('Migration Dry Run failed:', err);
  }
  
  console.log('--- END DRY RUN ---');
}

dryRun();
