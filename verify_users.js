const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function verify() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const url = env.match(/VITE_SUPABASE_URL="(.*)"/)[1];
  const key = env.match(/VITE_SUPABASE_ANON_KEY="(.*)"/)[1];
  
  const supabase = createClient(url, key);
  const { data, error } = await supabase.from('sales').select('username,password,role');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Users:', JSON.stringify(data, null, 2));
  }
}

verify();
