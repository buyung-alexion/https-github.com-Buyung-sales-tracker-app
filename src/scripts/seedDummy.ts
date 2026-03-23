import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { SEED_PROSPEK, SEED_CUSTOMER } from '../store/seedData';
import { resolve } from 'path';

// Load env from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  // Take 5 items, manually strip id/created_at to let Postgres generate them
  const prospeks = SEED_PROSPEK.slice(0, 5).map(({ id, created_at, ...rest }) => rest);
  const customers = SEED_CUSTOMER.slice(0, 5).map(({ id, created_at, created_by, status, ...rest }) => ({
    ...rest,
    status: 'Aman',
    created_by: rest.sales_pic
  }));

  console.log('Inserting 5 prospek...');
  const { error: errP } = await supabase.from('prospek').insert(prospeks);
  if (errP) console.error('Error inserting prospek:', errP);

  console.log('Inserting 5 customer...');
  const { error: errC } = await supabase.from('customer').insert(customers);
  if (errC) console.error('Error inserting customer:', errC);

  if (!errP && !errC) {
    console.log('Successfully inserted 5 prospek and 5 customer data!');
  }
}

seed();
