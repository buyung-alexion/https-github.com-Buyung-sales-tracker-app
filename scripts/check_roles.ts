
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRoles() {
  const { data, error } = await supabase.from('sales').select('role').limit(10)
  if (error) {
    console.error('Error:', error)
    return
  }
  console.log('Available Roles:', [...new Set(data?.map(i => i.role))])
}

checkRoles()
