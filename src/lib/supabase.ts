import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const ADELAYNE_SUPABASE_ORIGIN = 'https://tfvlgelxqsfyjigteagy.supabase.co';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  );
}

if (new URL(supabaseUrl).origin !== ADELAYNE_SUPABASE_ORIGIN) {
  throw new Error('Supabase configuration points to a different project. Verify the Adelayne project URL.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Función para probar la conexión
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').single();
    if (error) throw error;
    console.log('✅ Conexión a Supabase exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a Supabase:', error);
    return false;
  }
};
