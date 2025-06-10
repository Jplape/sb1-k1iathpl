import { tableExists } from './src/lib/supabase';

async function checkTable() {
  const exists = await tableExists('auth_logs');
  console.log('Table auth_logs exists:', exists);
}

checkTable().catch(console.error);