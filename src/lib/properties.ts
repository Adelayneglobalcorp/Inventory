import { supabase } from './supabase';
import { Property, PropertyStatus } from '../types/property';

export interface PropertyResponse {
  data: Property | null;
  error: string | null;
}

export interface PropertiesResponse {
  data: Property[] | null;
  error: string | null;
}

// Obtener todas las propiedades
export const getProperties = async (filters?: {
  status?: string;
  city?: string;
  state?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<PropertiesResponse> => {
  try {
    let query = supabase
      .from('properties')
      .select(`
        *,
        property_images(
          id,
          url,
          alt_text,
          is_primary,
          sort_order
        )
      `);

    // Aplicar filtros si existen
    if (filters) {
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.city) query = query.eq('city', filters.city);
      if (filters.state) query = query.eq('state', filters.state);
      if (filters.propertyType) query = query.eq('property_type', filters.propertyType);
      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error fetching properties:', error);
    return { data: null, error: (error as Error).message };
  }
};

// Obtener una propiedad por ID
export const getPropertyById = async (id: string): Promise<PropertyResponse> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        profiles:owner_id (
          full_name,
          email,
          company
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

// Obtener propiedades del usuario actual
export const getUserProperties = async (): Promise<PropertiesResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

// Crear una nueva propiedad
export const createProperty = async (property: Omit<Property, 'id' | 'created_at' | 'updated_at'>): Promise<PropertyResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const propertyWithOwner = {
      ...property,
      owner_id: user.id,
    };

    const { data, error } = await supabase
      .from('properties')
      .insert(propertyWithOwner)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

// Actualizar una propiedad
export const updateProperty = async (id: string, updates: Partial<Property>): Promise<PropertyResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Obtener información de la propiedad y el rol del usuario
    const [{ data: property }, { data: profile }] = await Promise.all([
      supabase.from('properties').select('owner_id').eq('id', id).single(),
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    ]);

    if (!property) throw new Error('Propiedad no encontrada');
    
    // Permitir actualización si es el propietario O si es admin
    const isOwner = property.owner_id === user.id;
    const isAdmin = profile?.role === 'admin';
    
    if (!isOwner && !isAdmin) throw new Error('No autorizado');

    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('No se pudo editar. Ejecuta el archivo "fix-properties-admin-rls.sql" en tu cuenta de Supabase (SQL Editor) para habilitar los permisos de Administrador.');
    
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

// Eliminar una propiedad
export const deleteProperty = async (id: string): Promise<{ error: string | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Obtener información de la propiedad y el rol del usuario
    const [{ data: property }, { data: profile }] = await Promise.all([
      supabase.from('properties').select('owner_id').eq('id', id).single(),
      supabase.from('profiles').select('role').eq('id', user.id).single()
    ]);

    if (!property) throw new Error('Propiedad no encontrada');
    
    // Permitir eliminación si es el propietario O si es admin
    const isOwner = property.owner_id === user.id;
    const isAdmin = profile?.role === 'admin';
    
    if (!isOwner && !isAdmin) throw new Error('No autorizado');

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Subir imagen de propiedad
export const uploadPropertyImage = async (file: File, propertyId: string): Promise<{ url: string | null; error: string | null }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${propertyId}/${Date.now()}.${fileExt}`;
    const filePath = `properties/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error: any) {
    return { url: null, error: error.message };
  }
};

// Guardar imágenes de propiedad en la base de datos
export const savePropertyImages = async (propertyId: string, images: { url: string; alt_text?: string }[]): Promise<{ error: string | null }> => {
  try {
    const imagesToInsert = images.map((img, index) => ({
      property_id: propertyId,
      url: img.url,
      alt_text: img.alt_text || '',
      is_primary: index === 0,
      sort_order: index,
    }));

    const { error } = await supabase
      .from('property_images')
      .insert(imagesToInsert);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Obtener imágenes de una propiedad
export const getPropertyImages = async (propertyId: string): Promise<{ data: any[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('property_images')
      .select('*')
      .eq('property_id', propertyId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};
