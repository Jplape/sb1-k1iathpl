import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  }
});

// Client admin avec bypass RLS
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  import.meta.env.VITE_SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_KEY}`
      }
    }
  }
);

/**
 * Vérifie si une table existe dans la base de données
 * @param tableName Nom de la table à vérifier
 * @returns Promise<boolean> true si la table existe
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('table_exists', { table_name: tableName });
  
  if (error) {
    console.error('Error checking table existence:', error);
    return false;
  }
  return !!data;
}