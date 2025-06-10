import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54322';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || 'postgres';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  try {
    const { data, error } = await supabase
      .from('auth_logs')
      .select('*')
      .limit(1);

    if (error) throw error;
    console.log('Table auth_logs exists:', data !== null);
  } catch (err) {
    console.error('Error checking table:', err.message);
  }
}

checkTable();