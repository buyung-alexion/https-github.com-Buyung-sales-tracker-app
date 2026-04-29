import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xpveprqtfwvqaigeiniv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I";
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateOrders() {
  console.log('Fetching existing orders...');
  const { data: orders, error: fetchError } = await supabase.from('orders').select('id, amount');
  if (fetchError) {
    console.error('Fetch Error:', fetchError);
    return;
  }
  
  console.log(`Found ${orders.length} orders. Updating...`);
  
  // We can update them sequentially or in batches.
  let count = 0;
  for (const order of orders) {
    // If the amount is larger than 500 or so, it's definitely a monetary value. 
    // The user said "ubah jadi 100 aja semuanya dulu", so let's update them all to 100!
    const { error: updateError } = await supabase
      .from('orders')
      .update({ amount: 100 })
      .eq('id', order.id);
      
    if (updateError) {
      console.error(`Error updating order ${order.id}:`, updateError);
    } else {
      count++;
    }
  }
  
  console.log(`Successfully updated ${count} orders to volume = 100.`);
}

updateOrders();
