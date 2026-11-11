-- DIAGNÓSTICO: Ver error exacto del trigger
-- ====================================================

-- 1. Ver el código actual del trigger
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 2. Verificar si hay algún error reciente en la función
-- (Simulamos la inserción que haría el trigger)

-- 3. Intentar reproducir el error manualmente
DO $$
DECLARE
  last_user RECORD;
BEGIN
  -- Obtener último usuario
  SELECT * INTO last_user
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;
  
  RAISE NOTICE 'Intentando crear perfil para: %', last_user.email;
  
  -- Intentar insertar como lo haría el trigger
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, is_approved, created_at, updated_at)
    VALUES (
      last_user.id,
      last_user.email,
      COALESCE(last_user.raw_user_meta_data->>'full_name', split_part(last_user.email, '@', 1)),
      COALESCE(last_user.raw_user_meta_data->>'role', 'pendiente'),
      false,
      NOW(),
      NOW()
    );
    RAISE NOTICE 'ÉXITO: Perfil creado';
    
    -- Limpiar (comentar esto si quieres mantener el perfil)
    DELETE FROM public.profiles WHERE id = last_user.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: % - %', SQLSTATE, SQLERRM;
  END;
END $$;

-- 4. Verificar permisos RLS
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 5. Verificar si la función tiene los permisos correctos
SELECT 
  proname,
  prosecdef,
  proowner::regrole as owner
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 6. Mensaje final
SELECT 'Diagnóstico completado. Revisa los NOTICES arriba.' as status;
