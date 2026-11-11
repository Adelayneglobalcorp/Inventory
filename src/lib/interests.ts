import { supabase } from '@/lib/supabase';
import type { PropertyInterest, InterestWithDetails, InterestStatus } from '@/types/interest';

// Agregar interés a una propiedad
export const addInterest = async (
  propertyId: string, 
  userId: string, 
  notes?: string
): Promise<{ error: Error | null; data?: PropertyInterest }> => {
  console.log('🔍 addInterest llamado con:', { propertyId, userId, notes });
  
  try {
    // Intentar insertar directamente (si hay duplicados, la base de datos lo manejará)
    console.log('📝 Insertando nuevo interés en la base de datos...');
    const { data, error } = await supabase
      .from('property_interests')
      .insert({
        property_id: propertyId,
        user_id: userId,
        notes: notes || 'Interesado en esta propiedad',
        status: 'pending'
      })
      .select(`
        *,
        user:profiles(
          id,
          full_name,
          email,
          phone
        ),
        property:properties(
          id,
          title,
          address,
          price,
          status
        )
      `)
      .single();

    if (error) {
      console.error('❌ Error adding interest:', error);
      
      // Si es error de duplicado, significa que ya existe
      if (error.code === '23505' || error.message.includes('duplicate key')) {
        console.log('📝 El interés ya existe (error de duplicado)');
        return { error: new Error('Ya has mostrado interés en esta propiedad') };
      }
      
      return { error: new Error(error.message) };
    }

    console.log('✅ Interés agregado correctamente a la base de datos:', data);
    return { error: null, data };
  } catch (err) {
    console.error('❌ Exception adding interest:', err);
    return { error: err as Error };
  }
};

// Obtener intereses de una propiedad específica (para admin/owner)
export const getPropertyInterests = async (
  propertyId: string
): Promise<{ error: Error | null; data?: InterestWithDetails[] }> => {
  try {
    const { data, error } = await supabase
      .from('property_interests')
      .select(`
        *,
        user:profiles(
          id,
          full_name,
          email,
          phone,
          role
        ),
        property:properties(
          id,
          title,
          address,
          price,
          status,
          image_url,
          property_images(
            id,
            url,
            alt_text,
            is_primary,
            sort_order
          )
        )
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error getting property interests:', error);
      return { error: new Error(error.message) };
    }

    return { error: null, data: data as InterestWithDetails[] || [] };
  } catch (err) {
    console.error('❌ Exception getting property interests:', err);
    return { error: err as Error };
  }
};

// Obtener todos los intereses (para admin)
export const getAllInterests = async (
  status?: InterestStatus
): Promise<{ error: Error | null; data?: InterestWithDetails[] }> => {
  try {
    let query = supabase
      .from('property_interests')
      .select(`
        *,
        user:profiles(
          id,
          full_name,
          email,
          phone,
          role
        ),
        property:properties(
          id,
          title,
          address,
          price,
          status,
          image_url,
          property_images(
            id,
            url,
            alt_text,
            is_primary,
            sort_order
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error getting all interests:', error);
      return { error: new Error(error.message) };
    }

    return { error: null, data: data as InterestWithDetails[] || [] };
  } catch (err) {
    console.error('❌ Exception getting all interests:', err);
    return { error: err as Error };
  }
};

// Obtener intereses de un usuario específico
export const getUserInterests = async (
  userId: string
): Promise<{ error: Error | null; data?: InterestWithDetails[] }> => {
  console.log('🔍 Getting user interests:', userId);
  
  try {
    const { data, error } = await supabase
      .from('property_interests')
      .select(`
        *,
        user:profiles(
          id,
          full_name,
          email,
          phone,
          role
        ),
        property:properties(
          id,
          title,
          address,
          price,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error getting user interests:', error);
      return { error: new Error(error.message) };
    }

    console.log('✅ User interests retrieved:', data?.length || 0);
    return { error: null, data: data as InterestWithDetails[] || [] };
  } catch (err) {
    console.error('❌ Exception getting user interests:', err);
    return { error: err as Error };
  }
};

// Actualizar estado de un interés
export const updateInterestStatus = async (
  interestId: string, 
  status: InterestStatus, 
  notes?: string
): Promise<{ error: Error | null; data?: PropertyInterest }> => {
  try {
    const { data, error } = await supabase
      .from('property_interests')
      .update({
        status,
        notes: notes || undefined
      })
      .eq('id', interestId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating interest status:', error);
      return { error: new Error(error.message) };
    }

    return { error: null, data };
  } catch (err) {
    console.error('❌ Exception updating interest status:', err);
    return { error: err as Error };
  }
};

// Eliminar interés
export const removeInterest = async (interestId: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('property_interests')
      .delete()
      .eq('id', interestId);

    if (error) {
      console.error('❌ Error removing interest:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    console.error('❌ Exception removing interest:', err);
    return { error: err as Error };
  }
};

// Eliminar interés por usuario y propiedad
export const removeInterestByUserAndProperty = async (userId: string, propertyId: string): Promise<{ error: Error | null }> => {
  console.log('🔍 removeInterestByUserAndProperty llamado con:', { userId, propertyId });
  
  try {
    const { error } = await supabase
      .from('property_interests')
      .delete()
      .eq('user_id', userId)
      .eq('property_id', propertyId);

    if (error) {
      console.error('❌ Error removing interest by user and property:', error);
      return { error: new Error(error.message) };
    }

    console.log('✅ Interés eliminado correctamente de la base de datos');
    return { error: null };
  } catch (err) {
    console.error('❌ Exception removing interest by user and property:', err);
    return { error: err as Error };
  }
};

// Verificar si un usuario ya mostró interés en una propiedad
export const checkUserInterest = async (
  propertyId: string, 
  userId: string
): Promise<{ error: Error | null; data?: PropertyInterest }> => {
  console.log('🔍 checkUserInterest llamado con:', { propertyId, userId });
  
  try {
    // Usar una consulta más simple para evitar problemas de RLS
    const { data, error } = await supabase
      .from('property_interests')
      .select('id, status, created_at')
      .eq('property_id', propertyId)
      .eq('user_id', userId)
      .maybeSingle(); // maybeSingle en lugar de single para evitar errores

    console.log('🔍 Respuesta de Supabase:', { data, error });

    if (error) {
      console.error('❌ Error checking user interest:', error);
      
      // Si es error 406, la tabla no existe
      if (error.code === '406' || error.message.includes('Not Acceptable')) {
        console.log('🚨 Error 406: La tabla property_interests no existe');
        console.log('📝 Esto significa que los intereses NO se están guardando en la base de datos');
        return { error: new Error('Tabla property_interests no existe'), data: null };
      }
      
      return { error: new Error(error.message) };
    }

    console.log('✅ checkUserInterest exitoso, datos encontrados:', data);
    
    // Convertir a formato PropertyInterest completo
    const fullInterest: PropertyInterest | null = data ? {
      id: data.id,
      property_id: propertyId,
      user_id: userId,
      notes: 'Interesado en esta propiedad',
      status: data.status,
      created_at: data.created_at,
      updated_at: data.created_at
    } : null;
    
    return { error: null, data: fullInterest || undefined };
  } catch (err) {
    console.error('❌ Exception checking user interest:', err);
    return { error: err as Error };
  }
};
