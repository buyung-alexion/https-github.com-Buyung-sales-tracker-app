import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function debug() {
  console.log('Checking connection...');
  const { data: sales, error: sErr } = await supabase.from('sales').select('*');
  console.log('Sales Count:', sales?.length || 0);
  if (sErr) console.error('Sales Error:', sErr);

  const { data: prospek, error: pErr } = await supabase.from('prospek').select('*');
  console.log('Prospek Count:', prospek?.length || 0);
  if (pErr) console.error('Prospek Error:', pErr);

  const { data: activities, error: aErr } = await supabase.from('activity').select('*');
  console.log('Activity Count:', activities?.length || 0);
  if (aErr) console.error('Activity Error:', aErr);

  const { data: customers, error: cErr } = await supabase.from('customer').select('*');
  console.log('Customer Count:', customers?.length || 0);
  if (cErr) console.error('Customer Error:', cErr);

  const buyungs = sales?.filter(s => s.nama.toLowerCase().includes('buyung'));
  console.log('Buyung Users Found:', buyungs?.map(b => ({ id: b.id, nama: b.nama, role: b.role })));
  
  const buyung = buyungs?.[0];
  
  if (buyung) {
    const buyungProspek = prospek?.filter(p => p.sales_owner === buyung.id);
    console.log('Buyung Prospek Count:', buyungProspek?.length || 0);
    const buyungNego = (await supabase.from('leads_negotiations').select('*').eq('sales_id', buyung.id)).data;
    console.log('Buyung Nego Count:', buyungNego?.length || 0);
    const buyungCustomers = customers?.filter(c => c.sales_pic === buyung.id);
    console.log('Buyung Customer Count:', buyungCustomers?.length || 0);
  }
}

debug();
