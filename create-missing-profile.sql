-- Crear perfil para un usuario si no existe
-- Reemplaza 'nuevo_usuario@email.com' con el email real del usuario creado

INSERT INTO public.profiles (id, email, full_name, role, is_approved, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
  COALESCE(raw_user_meta_data->>'role', 'investor'),
  false,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'nuevo_usuario@email.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = 'nuevo_usuario@email.com'
  );

-- Verificar que se creó
SELECT * FROM public.profiles WHERE email = 'nuevo_usuario@email.com';
