
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xpveprqtfwvqaigeiniv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I";
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('--- START MIGRATION ---');
  
  try {
    const { data: p } = await supabase.from('prospek').select('*').order('created_at', { ascending: true });
    const { data: c } = await supabase.from('customer').select('*').order('tanggal_join', { ascending: true });
    const { data: a } = await supabase.from('activity').select('*');

    console.log(`Processing ${p.length} prospects, ${c.length} customers...`);

    // 1. MIGRATING PROSPECTS
    for (let i = 0; i < p.length; i++) {
        const oldId = p[i].id;
        const newId = `P${(i + 1).toString().padStart(3, '0')}`;
        
        if (oldId === newId) continue;

        console.log(`Migrating Prospect: ${oldId} -> ${newId}`);

        // Update activities first
        const { error: aErr } = await supabase.from('activity').update({ target_id: newId }).eq('target_id', oldId);
        if (aErr) console.error(`Error updating activities for ${oldId}:`, aErr);

        // Update Prospek ID
        // Note: Updating PK directly might require cloning if restricted.
        // We'll try direct update first.
        const { error: pErr } = await supabase.from('prospek').update({ id: newId }).eq('id', oldId);
        if (pErr) {
            console.error(`Error updating Prospect ID ${oldId}:`, pErr);
            // Fallback: Insert new, then delete old
            const { error: insErr } = await supabase.from('prospek').insert([{ ...p[i], id: newId }]);
            if (!insErr) {
                await supabase.from('prospek').delete().eq('id', oldId);
            } else {
                console.error(`Fallback failed for ${oldId}:`, insErr);
            }
        }
    }

    // 2. MIGRATING CUSTOMERS
    for (let i = 0; i < c.length; i++) {
        const oldId = c[i].id;
        const newId = `C${(i + 1).toString().padStart(3, '0')}`;
        
        if (oldId === newId) continue;

        console.log(`Migrating Customer: ${oldId} -> ${newId}`);

        // Update activities first
        const { error: aErr } = await supabase.from('activity').update({ target_id: newId }).eq('target_id', oldId);
        if (aErr) console.error(`Error updating activities for ${oldId}:`, aErr);

        // Update Customer ID
        const { error: cErr } = await supabase.from('customer').update({ id: newId }).eq('id', oldId);
        if (cErr) {
            console.error(`Error updating Customer ID ${oldId}:`, cErr);
            // Fallback: Insert new, then delete old
            const { error: insErr } = await supabase.from('customer').insert([{ ...c[i], id: newId }]);
            if (!insErr) {
                await supabase.from('customer').delete().eq('id', oldId);
            } else {
                console.error(`Fallback failed for ${oldId}:`, insErr);
            }
        }
    }

    console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrate();
