-- PERMISOS: Permitir que el frontend cree perfiles de usuarios nuevos
-- ====================================================

-- 1. Verificar políticas actuales de profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 2. Crear política para permitir insert a usuarios autenticados (para su propio perfil)
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;

CREATE POLICY "Users can create own profile" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- 3. También permitir a anon crear perfiles (durante registro)
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;

CREATE POLICY "Allow profile creation during signup" 
  ON public.profiles 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- 4. Verificar que se crearon
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. Mensaje
SELECT 'Políticas actualizadas - ahora el frontend puede crear perfiles' as status;
