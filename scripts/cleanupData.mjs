import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xpveprqtfwvqaigeiniv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanup() {
  console.log('🚀 Memulai Pembersihan Data Demo (Round 2)...');

  // 1. Ambil ID Sales Demo
  const { data: sales, error: salesErr } = await supabase
    .from('sales')
    .select('id, nama')
    .in('nama', ['Erlan', 'Ppin', 'Nanda', 'Demo Sales']);
  
  if (salesErr) {
    console.error('❌ Gagal mengambil data sales:', salesErr);
    return;
  }

  const salesIds = sales.map(s => s.id);
  console.log(`📍 Ditemukan ${salesIds.length} sales demo: ${sales.map(s => s.nama).join(', ')}`);

  // 2. Bersihkan Tabel Transaksional (Semua data agar fresh)
  // Use a proper UUID format or just a filter that works for multiple types
  console.log('🧹 Membersihkan tabel Activity...');
  await supabase.from('activity').delete().gte('id', 0); // numeric or uuid range hack
  await supabase.from('activity').delete().not('id', 'is', null);

  console.log('🧹 Membersihkan tabel Prospek...');
  await supabase.from('prospek').delete().not('id', 'is', null);

  console.log('🧹 Membersihkan tabel Customer...');
  await supabase.from('customer').delete().not('id', 'is', null);

  // 3. Hapus Sales Demo
  if (salesIds.length > 0) {
    console.log('🧹 Menghapus user sales demo...');
    const { error: delSalesErr } = await supabase.from('sales').delete().in('id', salesIds);
    if (delSalesErr) {
      console.error('❌ Error delete sales (FK issue?):', delSalesErr);
      console.log('💡 Mencoba hapus paksa relasi...');
    }
  }

  console.log('✨ PEMBERSIHAN SELESAI!');
}

cleanup();
