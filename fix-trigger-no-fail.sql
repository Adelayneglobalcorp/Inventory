-- FIX DEFINITIVO: Hacer que el trigger NO falle la creación de usuario
-- Si el trigger falla, no debe cancelar la creación del usuario

-- 1. Eliminar trigger y función existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Crear función con manejo de errores que NO falle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_exists BOOLEAN;
BEGIN
  -- Verificar si el perfil ya existe
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO profile_exists;
  
  -- Solo crear si no existe
  IF NOT profile_exists THEN
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
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'pendiente'),
        false,
        NOW(),
        NOW()
      );
    EXCEPTION WHEN OTHERS THEN
      -- NO hacer nada si falla - solo loguear
      RAISE LOG 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  -- SIEMPRE retornar NEW para que el usuario se cree
  RETURN NEW;
END;
$$;

-- 3. Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar que se creó correctamente
SELECT 
  'Trigger recreado con manejo de errores' as status,
  tgname,
  tgenabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname = 'on_auth_user_created';
