import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xpveprqtfwvqaigeiniv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I";
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  console.log('--- STARTING DEMO CLEANUP ---');

  // 1. Identification of demo sales to remove
  // We keep the manager/admin if possible
  const demoSalesIds = ['Ppin', 'Erlan', 'Nanda'];

  try {
    // 2. Delete from Activity
    console.log('Cleaning Activities...');
    const { error: errA } = await supabase.from('activity').delete().in('id_sales', demoSalesIds);
    if (errA) console.error('Activity delete error:', errA);

    // 3. Delete from Messages
    console.log('Cleaning Messages...');
    const { error: errM } = await supabase.from('messages').delete().neq('sender_id', 'SYSTEM_KEEP');
    if (errM) console.error('Messages delete error:', errM);

    // 4. Delete from Prospek
    console.log('Cleaning Prospek...');
    const { error: errP } = await supabase.from('prospek').delete().neq('id', 'SYSTEM_KEEP');
    if (errP) console.error('Prospek delete error:', errP);

    // 5. Delete from Customer
    console.log('Cleaning Customer...');
    const { error: errC } = await supabase.from('customer').delete().neq('id', 'SYSTEM_KEEP');
    if (errC) console.error('Customer delete error:', errC);

    // 6. Delete Demo Sales Accounts
    console.log('Cleaning Demo Sales Accounts...');
    const { error: errS } = await supabase.from('sales').delete().in('id', demoSalesIds);
    if (errS) console.error('Sales delete error:', errS);

    console.log('--- CLEANUP COMPLETE ---');
  } catch (err) {
    console.error('Cleanup process failed:', err);
  }
}

cleanup();
