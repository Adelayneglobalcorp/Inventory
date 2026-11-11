import { supabase } from './supabase';

export interface UserManagementResponse {
  data: any[] | null;
  error: string | null;
}

// Obtener todos los usuarios con sus perfiles (incluyendo pendientes de aprobación)
export const getAllUsers = async (): Promise<UserManagementResponse> => {
  try {
    // Primero obtener perfiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Los datos de auth.users no son accesibles directamente, usamos solo profiles
    const combinedData = profiles?.map(profile => ({
      ...profile,
      auth_users: { email: profile.email }, // Simplificado
    })) || [];

    return { data: combinedData, error: null };
  } catch (error: any) {
    console.error('Error in getAllUsers:', error);
    return { data: null, error: error.message };
  }
};

// Aprobar usuario
export const approveUser = async (userId: string, approvedBy: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_approved: true,
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Rechazar usuario
export const rejectUser = async (userId: string, rejectedBy: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_approved: false,
        approved_by: rejectedBy,
        approved_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Eliminar usuario completamente (usando RPC seguro)
export const deleteUser = async (userId: string): Promise<{ error: string | null }> => {
  try {
    // Intentamos usar la función RPC delete_user_admin
    const { data: rpcSuccess, error: rpcError } = await supabase.rpc('delete_user_admin', {
      user_id: userId
    });

    if (rpcError) {
      console.warn('RPC delete_user_admin falló o no existe. Usando fallback de perfiles:', rpcError);

      // Fallback: al menos eliminar el perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;
      return { error: 'Se eliminó perfil pero falta eliminar usuario de Auth (Ejecutar SQL rpc)' };
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error en deleteUser:', error);
    return { error: error.message };
  }
};

// Actualizar rol de usuario
export const updateUserRole = async (userId: string, newRole: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Confirmar email de usuario (usando RPC seguro)
export const confirmUserEmail = async (userId: string): Promise<{ error: string | null }> => {
  try {
    // Intentamos usar la función RPC confirm_user_admin
    // Esta función debe estar creada en Supabase vía SQL
    const { data: rpcSuccess, error: rpcError } = await supabase.rpc('confirm_user_admin', {
      user_id: userId
    });

    if (rpcError) {
      console.warn('RPC confirm_user_admin falló o no existe. Usando fallback de perfiles:', rpcError);

      // Fallback: al menos lo marcamos en profiles (aunque esto no arregla el login de auth)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email_confirmed_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) throw profileError;
      return { error: 'Se actualizó perfil pero falta confirmación de Auth (Ejecutar SQL rpc)' };
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error en confirmUserEmail:', error);
    return { error: error.message };
  }
};
// Generar código de administrador aleatorio
export const generateAdminCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Guardar código de administrador en la base de datos
export const saveAdminCode = async (code: string, userId: string, createdBy: string): Promise<{ error: string | null }> => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expira en 7 días

    const { error } = await supabase
      .from('admin_codes')
      .insert({
        code,
        user_id: userId,
        created_by: createdBy,
        expires_at: expiresAt.toISOString(),
      });

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Verificar código de administrador
export const verifyAdminCode = async (code: string): Promise<{ valid: boolean; userId?: string; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('admin_codes')
      .select('user_id, expires_at, is_used')
      .eq('code', code)
      .single();

    if (error) throw error;

    const now = new Date();
    const expiresAt = data.expires_at ? new Date(data.expires_at) : null;

    const isValid = !data.is_used && (!expiresAt || expiresAt > now);

    return {
      valid: isValid,
      userId: isValid ? data.user_id : undefined,
    };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
};

// Marcar código como usado
export const useAdminCode = async (code: string, userId: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('admin_codes')
      .update({
        is_used: true,
        used_by: userId,
        used_at: new Date().toISOString(),
      })
      .eq('code', code)
      .eq('is_used', false);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Obtener códigos generados por un administrador
export const getAdminCodes = async (createdBy: string): Promise<{ data: any[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('admin_codes')
      .select(`
        *,
        profiles:user_id (full_name, email),
        used_by_profile:used_by (full_name, email)
      `)
      .eq('created_by', createdBy)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};
