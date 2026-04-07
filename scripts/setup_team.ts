import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Helper to get envs manually since we might not have dotenv
function getEnv(key: string): string {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(new RegExp(`${key}=(.*)`));
      if (match) return match[1].replace(/["']/g, '').trim();
    }
  } catch (e) {}
  return process.env[key] || '';
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ ERROR: Supabase Credentials not found in .env.local');
  console.log('Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const team = [
  { nama: 'Daniel Fianto', username: 'daniel', role: 'manager' },
  { nama: 'Buyung', username: 'buyung', role: 'sales' },
  { nama: 'Admin', username: 'admin', role: 'admin' },
  { nama: 'Riyan Widaya', username: 'riyan', role: 'sales' },
  { nama: 'M. Burhan', username: 'burhan', role: 'sales' },
  { nama: 'Hari', username: 'hari', role: 'sales' },
  { nama: 'Eko Paresetyo', username: 'eko', role: 'sales' },
  { nama: 'Yudi Irawan', username: 'yudi', role: 'sales' },
  { nama: 'M. Azid', username: 'azid', role: 'sales' },
];

const password = '123456';

async function setupTeam() {
  console.log('🚀 Starting Team Registration...');

  // Convert to full Sales objects
  const fullTeam = team.map((member, index) => ({
    id: `u${index + 1}`, // Predictable simple IDs
    nama: member.nama,
    username: member.username,
    role: member.role,
    password: password,
    armada: 'A' as const,
    target_prospek_baru: 10,
    target_closing_baru: 2,
    target_maintenance: 20,
    target_visit: 40,
    no_wa: '62800000000', // Placeholder
  }));

  for (const user of fullTeam) {
    console.log(`- Registering ${user.nama} (${user.username})...`);
    const { error } = await supabase
      .from('sales')
      .upsert(user, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Failed for ${user.username}:`, error.message);
    } else {
      console.log(`  ✅ Success!`);
    }
  }

  console.log('\n✨ Team setup complete! All users can login with password:', password);
}

setupTeam();
