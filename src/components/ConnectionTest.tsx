import { testConnection } from '@/lib/supabase';

// Probar conexión al cargar la aplicación
testConnection();

export default function ConnectionTest() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Test de Conexión</h1>
      <p>Revisa la consola para ver el resultado de la conexión a Supabase.</p>
    </div>
  );
}
