import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xpveprqtfwvqaigeiniv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmVwcnF0Znd2cWFpZ2Vpbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM3OTEsImV4cCI6MjA4OTU4OTc5MX0.bgDBy1iL1AHiAInrI8ru-0QF211e39C8uXTPRAYDw5I";

const supabase = createClient(supabaseUrl, supabaseKey);

const DATA = {
  master_areas: [
    { id: 'SMD', name: 'Samarinda' },
    { id: 'BPN', name: 'Balikpapan' },
    { id: 'PJM', name: 'Penajam' },
    { id: 'SPK', name: 'Sepaku (IKN)' },
    { id: 'TNG', name: 'Tanah Grogot' },
    { id: 'BTG', name: 'Bontang' },
    { id: 'BK', name: 'Berau' }
  ],
  master_categories: [
    { id: 'Retail', name: 'Retail' },
    { id: 'Grosir', name: 'Grosir' },
    { id: 'Catering', name: 'Catering' },
    { id: 'Hotel', name: 'Hotel' },
    { id: 'Resto', name: 'Resto' },
    { id: 'Other', name: 'Other' }
  ],
  master_channels: [
    { id: 'Canvasing', name: 'Canvasing' },
    { id: 'Reference', name: 'Reference' },
    { id: 'Social Media', name: 'Social Media' },
    { id: 'WA Marketing', name: 'WA Marketing' },
    { id: 'Exhibition', name: 'Exhibition' }
  ],
  master_prospect_status: [
    { id: 'Cold', name: 'Cold' },
    { id: 'Warm', name: 'Warm' },
    { id: 'Hot', name: 'Hot' }
  ],
  master_actions: [
    { id: 'Visit', name: 'Visit' },
    { id: 'Call', name: 'Call' },
    { id: 'WA', name: 'WA' },
    { id: 'Order', name: 'Order' },
    { id: 'Note', name: 'Note' }
  ]
};

async function seed() {
  console.log('🚀 Starting Master Data Seeding...');

  for (const [table, rows] of Object.entries(DATA)) {
    console.log(`\n📦 Seeding ${table}...`);
    
    const { error: deleteError } = await supabase.from(table).delete().neq('id', 'NONE');
    if (deleteError) {
      console.warn(`⚠️ Warning: Could not clear table ${table}. Proceeding with upsert.`);
    }

    const { data, error } = await supabase.from(table).upsert(rows);
    
    if (error) {
      console.error(`❌ Error seeding ${table}:`, error.message);
    } else {
      console.log(`✅ Successfully seeded ${rows.length} records into ${table}.`);
    }
  }

  console.log('\n✨ Seeding Complete!');
}

seed();
