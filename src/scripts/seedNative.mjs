import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const prospeks = [
  { nama_toko: 'Toko Tunas Baru', nama_pic: 'Bapak Jaya', no_wa: '6281234567891', area: 'Kota', status: 'Hot', sales_owner: 's3' },
  { nama_toko: 'Grosir Maju Bersama', nama_pic: 'Ibu Ratna', no_wa: '6281234567892', area: 'Sepaku', status: 'Warm', sales_owner: 's3' },
  { nama_toko: 'Distributor Sinar Terang', nama_pic: 'Koh Ahong', no_wa: '6281234567893', area: 'Gerogot', status: 'Hot', sales_owner: 's3' },
  { nama_toko: 'Retail Sukses Makmur', nama_pic: 'Pak Budi', no_wa: '6281234567894', area: 'Kota', status: 'Cold', sales_owner: 's3' },
  { nama_toko: 'Horeca Resto Enak', nama_pic: 'Chef Juna', no_wa: '6281234567895', area: 'Sepaku', status: 'Warm', sales_owner: 's3' }
];

const customers = [
  { nama_toko: 'Langganan Abadi', no_wa: '6282234567801', area: 'Kota', total_order_volume: 1500, sales_pic: 's3', last_order_date: new Date().toISOString() },
  { nama_toko: 'Toko Laris Manis', no_wa: '6282234567802', area: 'Gerogot', total_order_volume: 850, sales_pic: 's3', last_order_date: new Date().toISOString() },
  { nama_toko: 'Grosir Berkat', no_wa: '6282234567803', area: 'Sepaku', total_order_volume: 2400, sales_pic: 's3', last_order_date: new Date().toISOString() },
  { nama_toko: 'Warung Pojok', no_wa: '6282234567804', area: 'Kota', total_order_volume: 120, sales_pic: 's3', last_order_date: new Date().toISOString() },
  { nama_toko: 'Kantin Sekolah', no_wa: '6282234567805', area: 'Sepaku', total_order_volume: 450, sales_pic: 's3', last_order_date: new Date().toISOString() }
];

async function seed() {
  const { error: errP } = await supabase.from('prospek').insert(prospeks);
  if (errP) console.error('Error insert prospek', errP);

  const { error: errC } = await supabase.from('customer').insert(customers);
  if (errC) console.error('Error insert customer', errC);

  console.log('Seed berhasil ditambahkan! Silakan cek aplikasinya.');
}
seed();
