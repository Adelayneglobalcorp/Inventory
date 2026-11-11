import { supabase } from './supabase';

export interface AuthResponse {
  user: any;
  profile: any;
  error: string | null;
}

// Versión simplificada del login para diagnóstico
export const signInSimple = async (email: string, password: string): Promise<AuthResponse> => {
  console.log('🔍 Iniciando login simple para:', email);
  
  try {
    console.log('📡 Llamando a Supabase auth...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('📊 Respuesta de auth:', { authData, authError });

    if (authError) {
      console.error('❌ Error en auth:', authError);
      return { user: null, profile: null, error: authError.message };
    }

    if (!authData.user) {
      console.error('❌ No se encontró usuario');
      return { user: null, profile: null, error: 'Usuario no encontrado' };
    }

    console.log('✅ Usuario autenticado:', authData.user.email);
    console.log('🔍 Buscando perfil...');

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      console.log('📊 Respuesta de perfil:', { profileData, profileError });

      if (profileError) {
        console.error('❌ Error en perfil:', profileError);
        // No retornamos error aquí, solo log
        return { user: authData.user, profile: null, error: null };
      }

      console.log('✅ Perfil encontrado:', profileData?.email);
      return { user: authData.user, profile: profileData, error: null };

    } catch (profileErr) {
      console.error('❌ Error crítico en perfil:', profileErr);
      return { user: authData.user, profile: null, error: null };
    }

  } catch (error: any) {
    console.error('❌ Error general:', error);
    // Evitar errores anidados
    const errorMessage = error?.message || 'Error desconocido';
    return { user: null, profile: null, error: errorMessage };
  }
};

// Alias para compatibilidad
export const signIn = signInSimple;
