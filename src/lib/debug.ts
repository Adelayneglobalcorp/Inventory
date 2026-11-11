import { supabase } from './supabase';

export const debugEnvironment = () => {
  console.log('🔍 Environment Variables Debug:');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('VITE_ENV:', import.meta.env.VITE_ENV);
  
  // Verificar que las variables estén cargadas
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.error('❌ VITE_SUPABASE_URL is not set');
    return false;
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('❌ VITE_SUPABASE_ANON_KEY is not set');
    return false;
  }
  
  console.log('✅ Environment variables are properly set');
  return true;
};

export const debugDatabase = async () => {
  console.log('🔍 Debugging database structure...');
  
  try {
    // Verificar tabla properties
    const { data: propertiesData, error: propertiesError } = await supabase
      .from('properties')
      .select('count')
      .single();
    
    console.log('📊 Properties table:', { 
      count: propertiesData?.count, 
      error: propertiesError 
    });

    // Verificar tabla property_images
    const { data: imagesData, error: imagesError } = await supabase
      .from('property_images')
      .select('count')
      .single();
    
    console.log('🖼️ Property images table:', { 
      count: imagesData?.count, 
      error: imagesError 
    });

    // Verificar tabla profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .single();
    
    console.log('👥 Profiles table:', { 
      count: profilesData?.count, 
      error: profilesError 
    });

    // Verificar conexión general
    const { data: connectionData, error: connectionError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    console.log('🔗 Connection test:', { 
      success: !connectionError, 
      error: connectionError,
      sampleData: connectionData 
    });

    return {
      properties: { count: propertiesData?.count, error: propertiesError },
      images: { count: imagesData?.count, error: imagesError },
      profiles: { count: profilesData?.count, error: profilesError },
      connection: { success: !connectionError, error: connectionError }
    };
  } catch (error) {
    console.error('❌ Debug error:', error);
    return null;
  }
};

export const createSampleProperty = async () => {
  console.log('🏠 Creating sample property...');
  
  try {
    // Primero obtener un usuario de ejemplo
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      throw new Error('No users found to assign property');
    }

    const sampleProperty = {
      title: 'Casa de Ejemplo',
      description: 'Una propiedad de ejemplo para pruebas',
      address: '123 Calle Principal',
      city: 'Ciudad de Ejemplo',
      state: 'Estado',
      zip_code: '12345',
      price: 250000,
      arv: 300000,
      rehab_cost: 25000,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1500,
      year_built: 2000,
      property_type: 'single_family',
      status: 'available',
      owner_id: profiles[0].id
    };

    const { data, error } = await supabase
      .from('properties')
      .insert(sampleProperty)
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Sample property created:', data);
    return data;
  } catch (error) {
    console.error('❌ Error creating sample property:', error);
    return null;
  }
};
