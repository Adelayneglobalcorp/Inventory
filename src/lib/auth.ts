import { supabase } from './supabase';
import { UserProfile } from '../types/property';

export interface AuthResponse {
  user: any;
  profile: UserProfile | null;
  error: string | null;
}

// Registro de usuario
export const signUp = async (email: string, password: string, fullName: string, isAdmin: boolean = false): Promise<AuthResponse> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: isAdmin ? 'admin' : 'investor',
        },
        emailRedirectTo: import.meta.env.VITE_SITE_URL || window.location.origin,
      },
    });

    if (authError) throw authError;

    // Para admin, creamos el perfil directamente sin esperar confirmación
    if (authData.user && isAdmin) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: authData.user.email!,
          full_name: fullName,
          role: 'admin',
        })
        .select()
        .single();

      if (profileError) throw profileError;

      return {
        user: authData.user,
        profile: profileData,
        error: null,
      };
    }

    // El perfil se crea automáticamente con el trigger para usuarios normales
    let profile = null;
    if (authData.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      profile = profileData;
    }

    return {
      user: authData.user,
      profile,
      error: null,
    };
  } catch (error: any) {
    return {
      user: null,
      profile: null,
      error: error.message,
    };
  }
};

// Login de usuario (temporalmente sin verificación de aprobación)
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;

    let profile = null;
    if (authData.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      // Temporalmente comentar la verificación de aprobación
      // if (profileData && !profileData.is_approved) {
      //   throw new Error('Tu cuenta está pendiente de aprobación por un administrador.');
      // }

      profile = profileData;
    }

    return {
      user: authData.user,
      profile,
      error: null,
    };
  } catch (error: any) {
    return {
      user: null,
      profile: null,
      error: error.message,
    };
  }
};

// Logout
export const signOut = async (): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Obtener usuario actual
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authData.user) {
      return { user: null, profile: null, error: null };
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return {
      user: authData.user,
      profile: profileData,
      error: null,
    };
  } catch (error: any) {
    return {
      user: null,
      profile: null,
      error: error.message,
    };
  }
};

// Actualizar perfil
export const updateProfile = async (profile: Partial<UserProfile>): Promise<{ error: string | null }> => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error('Usuario no autenticado');

    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', authData.user.id);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Escuchar cambios de autenticación
export const onAuthStateChange = (callback: (user: any) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null);
  });
};
