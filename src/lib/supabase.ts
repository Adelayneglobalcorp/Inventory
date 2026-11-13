import { createClient } from '@supabase/supabase-js';

// The project URL and publishable key are public browser-side configuration.
// Netlify environment variables may override them when provided.
const ADELAYNE_SUPABASE_URL = 'https://tfvlgelxqsfyjigteagy.supabase.co';
const ADELAYNE_PUBLISHABLE_KEY = 'sb_publishable_RseH9XY6qAeEwSugDk66KQ_BlILymIz';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || ADELAYNE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || ADELAYNE_PUBLISHABLE_KEY;

const ADELAYNE_SUPABASE_ORIGIN = 'https://tfvlgelxqsfyjigteagy.supabase.co';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  );
}

if (new URL(supabaseUrl).origin !== ADELAYNE_SUPABASE_ORIGIN) {
  throw new Error('Supabase configuration points to a different project. Verify the Adelayne project URL.');
}

// Inicio de sesión desde el sitio web oficial: llega con la sesión en el hash (#access_token=…&g360=1).
// detectSessionInUrl la toma; aquí solo se marca como sesión recordada para que no se cierre al cargar.
if (typeof window !== 'undefined' && window.location.hash.includes('g360=1') && window.location.hash.includes('access_token=')) {
  try {
    localStorage.setItem('g360_remember', '1');
    sessionStorage.setItem('g360_session_alive', '1');
  } catch { /* almacenamiento no disponible */ }
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
