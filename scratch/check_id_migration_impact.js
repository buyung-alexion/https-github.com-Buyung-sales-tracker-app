
import { createClient } from '@supabase/supabase-client';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking Foreign Keys and Relationships...');
  
  // We can't easily query pg_catalog with ANON key, 
  // but we can check if updating a Prospect ID updates an Activity target_id.
  
  const { data: p } = await supabase.from('prospek').select('id').limit(1).single();
  if (!p) {
    console.log('No prospects found to test.');
    return;
  }
  
  const { data: acts } = await supabase.from('activity').select('id, target_id').eq('target_id', p.id).limit(1);
  console.log(`Prospect ${p.id} has ${acts?.length || 0} activities.`);
}

checkSchema();
