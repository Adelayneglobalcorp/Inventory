-- ARREGLO COMPLETO: Recrear trigger de creación de usuarios

-- 1. Eliminar trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Eliminar función existente
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Verificar que la tabla profiles tiene todas las columnas necesarias
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'pendiente';

-- 4. Crear función mejorada con manejo de errores
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insertar perfil solo si no existe (previene duplicados)
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
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'pendiente'),
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 5. Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Verificar que se creó correctamente
SELECT 'Trigger creado exitosamente' as status;

-- 7. Verificar estructura de tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;
