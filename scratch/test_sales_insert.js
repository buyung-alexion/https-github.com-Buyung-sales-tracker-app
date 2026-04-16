
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xpveprqtfwvqaigeiniv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const testSales = {
    id: 'TEST_' + Date.now(),
    nama: 'Test Sales',
    username: 'testuser_' + Date.now(),
    password: 'password123',
    role: 'Sales',
    no_wa: '628123456789'
  };

  console.log('Attempting insert with:', testSales);
  const { data, error } = await supabase.from('sales').insert([testSales]).select();
  
  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert successful:', data);
    // Cleanup
    await supabase.from('sales').delete().eq('id', testSales.id);
  }
}

testInsert();
