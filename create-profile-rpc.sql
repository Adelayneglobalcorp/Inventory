-- SOLUCIÓN ALTERNATIVA: Función RPC para crear perfil
-- Ejecuta esto en Supabase SQL Editor

-- Función para crear perfil desde el frontend (bypass RLS)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT,
  user_role TEXT DEFAULT 'pendiente'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Ejecuta con permisos del creador (postgres)
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    is_approved, 
    created_at, 
    updated_at
  )
  VALUES (
    user_id,
    user_email,
    COALESCE(user_full_name, split_part(user_email, '@', 1)),
    COALESCE(user_role, 'pendiente'),
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error creating profile: %', SQLERRM;
  RETURN FALSE;
END;
$$;

-- Dar permisos a usuarios anónimos y autenticados para llamar la función
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Verificar que se creó
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'create_user_profile';

-- Mensaje de éxito
SELECT 'Función create_user_profile creada exitosamente' as status;
