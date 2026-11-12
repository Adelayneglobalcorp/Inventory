import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import i18n from '@/lib/i18n';
import type { User, Session } from '@supabase/supabase-js';
import type { UserRole } from '@/types/property';
import { notifySignupWebhook } from '@/lib/signupWebhook';

export type SignUpOptions = {
  isAdmin?: boolean;
  phone?: string;
  /** Idioma de preferencia elegido en el registro (obligatorio para usuarios generales). */
  language?: 'es' | 'en';
};

/** Aplica a la interfaz el idioma guardado en el perfil del usuario. */
async function applyProfileLanguage(userId: string) {
  try {
    const { data } = await supabase.from('profiles').select('preferred_language').eq('id', userId).maybeSingle();
    const lang = (data as { preferred_language?: string } | null)?.preferred_language;
    if ((lang === 'es' || lang === 'en') && i18n.resolvedLanguage !== lang) await i18n.changeLanguage(lang);
  } catch {
    /* sin idioma guardado: se mantiene el del navegador */
  }
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, options?: SignUpOptions) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  approveUser: (userId: string) => Promise<{ error: Error | null }>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inicializar autenticación
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        // «Recordarme» desmarcado: la sesión no sobrevive al cerrar el navegador.
        let notRemembered = false;
        try { notRemembered = localStorage.getItem('g360_remember') === '0' && !sessionStorage.getItem('g360_session_alive'); } catch { /* noop */ }
        if (currentSession?.user && notRemembered) {
          await supabase.auth.signOut();
          return;
        }
        if (currentSession?.user) void applyProfileLanguage(currentSession.user.id);

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);

          // Para usuarios existentes, asumimos rol del metadata primero
          const metadataRole = currentSession.user.user_metadata?.role as UserRole;
          console.log('🔍 Metadata role:', metadataRole);

          if (metadataRole) {
            setRole(metadataRole);
            console.log('✅ Using metadata role:', metadataRole);
          } else {
            // Solo si no hay metadata, intentamos consultar la BD
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', currentSession.user.id)
                .single();

              const finalRole = profile?.role || 'usuario';
              setRole(finalRole);
              console.log('✅ Using DB role:', finalRole);
            } catch (err) {
              console.error('❌ Error loading from DB, using default:', err);
              setRole('usuario');
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔄 Auth state changed:', event);

        if (event === 'SIGNED_IN' && newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);

          // Usar rol del metadata para login inmediato
          const metadataRole = newSession.user.user_metadata?.role as UserRole;
          console.log('🔍 Login metadata role:', metadataRole);

          if (metadataRole) {
            setRole(metadataRole);
            console.log('✅ Login using metadata role:', metadataRole);
          } else {
            setRole('usuario');
            console.log('✅ Login using default role: usuario');
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setRole(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    console.log('🔍 SignIn attempt:', { email });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ SignIn error:', error);
        return { error: new Error(error.code === 'invalid_credentials' ? i18n.t('authErrors.invalidCredentials') : error.code === 'email_not_confirmed' ? i18n.t('authErrors.emailNotConfirmed') : error.code === 'over_email_send_rate_limit' ? i18n.t('authErrors.rateLimited') : i18n.t('authErrors.generic')) };
      }

      if (!data.user) {
        return { error: new Error(i18n.t('authErrors.notFound')) };
      }

      // Verificar si el usuario está aprobado en la tabla profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_approved, full_name, preferred_language')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        console.error('❌ Profile fetch error:', profileError);
        return { error: new Error(i18n.t('authErrors.profileError')) };
      }

      console.log('📋 User profile:', profile);

      // Si no está aprobado y no es admin, no permitir login
      if (!profile.is_approved && profile.role !== 'admin') {
        console.log('🚫 User not approved:', profile);
        return { error: new Error(i18n.t('authErrors.pending')) };
      }

      // Sincronizar rol del perfil con el metadata del usuario si es diferente
      if (data.user.user_metadata?.role !== profile.role) {
        console.log('🔄 Syncing role from profile to metadata:', {
          oldRole: data.user.user_metadata?.role,
          newRole: profile.role
        });

        const { error: updateError } = await supabase.auth.updateUser({
          data: { role: profile.role }
        });

        if (updateError) {
          console.error('❌ Error updating user metadata:', updateError);
          // No bloquear el login si falla la actualización del metadata
        } else {
          console.log('✅ Role synced to metadata:', profile.role);
        }
      }

      const preferred = (profile as { preferred_language?: string }).preferred_language;
      if (preferred === 'es' || preferred === 'en') await i18n.changeLanguage(preferred);

      console.log('✅ Sign in successful for approved user');
      return { error: null };
    } catch (err: any) {
      console.error('❌ SignIn exception:', err);
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, options?: SignUpOptions): Promise<{ error: Error | null }> => {
    const isAdmin = options?.isAdmin ?? false;
    const phone = options?.phone?.trim() || undefined;
    const language = options?.language ?? (i18n.resolvedLanguage === 'en' ? 'en' : 'es');

    console.log('🔵 SignUp started:', { email, fullName, isAdmin, hasPhone: Boolean(phone) });

    try {
      // Paso 1: Crear usuario en auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            language,
            role: isAdmin ? 'admin' : 'pendiente',
            ...(phone ? { phone } : {}),
          },
        },
      });

      if (error) throw error;
      console.log('✅ User created in auth successfully');

      if (!data.user) {
        return { error: new Error(i18n.t('authErrors.signupError')) };
      }

      // Paso 2: Crear perfil en la tabla profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email || email,
          full_name: fullName,
          ...(phone ? { phone } : {}),
          role: isAdmin ? 'admin' : 'pendiente',
          is_approved: false,
          preferred_language: language,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
      } else {
        console.log('✅ Profile created successfully');
      }

      notifySignupWebhook({
        email: data.user.email || email,
        fullName,
        phone: phone ?? '',
      });

      return { error: null };
    } catch (err) {
      console.error('❌ SignUp error:', err);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setRole(null);
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  };

  const approveUser = async (userId: string): Promise<{ error: Error | null }> => {
    console.log('✅ Approving user:', userId);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error approving user:', error);
        return { error: new Error(error.message) };
      }

      console.log('✅ User approved successfully');
      return { error: null };
    } catch (err) {
      console.error('❌ Error approving user:', err);
      return { error: err as Error };
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole): Promise<{ error: Error | null }> => {
    console.log('🔄 Updating user role:', { userId, newRole });

    try {
      // Actualizar rol en la tabla profiles
      const { error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error updating user role:', error);
        return { error: new Error(error.message) };
      }

      // Si el usuario actual está cambiando su propio rol, actualizar el estado local
      if (user && user.id === userId) {
        console.log('🔄 Updating current user role locally');
        setRole(newRole);

        // También actualizar el metadata del usuario
        const { error: updateError } = await supabase.auth.updateUser({
          data: { role: newRole }
        });

        if (updateError) {
          console.error('❌ Error updating user metadata:', updateError);
        } else {
          console.log('✅ User role updated in both profiles and auth metadata');
        }
      }

      console.log('✅ User role updated successfully');
      return { error: null };
    } catch (err) {
      console.error('❌ Error updating user role:', err);
      return { error: err as Error };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    console.log('🔄 Requesting password reset for:', email);
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/reset-password`,
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error('❌ Reset password error:', err);
      return { error: err };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ error: Error | null }> => {
    console.log('🔄 Updating password');
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error('❌ Update password error:', err);
      return { error: err };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    role,
    loading,
    signIn,
    signUp,
    signOut,
    approveUser,
    updateUserRole,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
