// Función para probar diferentes claves de Supabase
export const testSupabaseConnection = async (url: string, key: string) => {
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Conexión exitosa con la clave proporcionada');
      return true;
    } else {
      console.log('❌ Error de conexión:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error de red:', error);
    return false;
  }
};

// Función para probar la clave actual
export const testCurrentKey = async () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('🔍 Probando conexión actual...');
  console.log('URL:', url);
  console.log('Key:', key ? key.substring(0, 20) + '...' : 'No encontrada');
  
  return await testSupabaseConnection(url, key);
};
