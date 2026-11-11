-- Crear perfil para usuario que no tiene (reemplaza el email)
INSERT INTO public.profiles (
  id, 
  email, 
  full_name, 
  role, 
  is_approved, 
  created_at, 
  updated_at
)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Nuevo Usuario'),
  COALESCE(raw_user_meta_data->>'role', 'investor'),
  false,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'EMAIL_DEL_NUEVO_USUARIO_AQUI'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = 'EMAIL_DEL_NUEVO_USUARIO_AQUI'
  );

-- Verificar que se creó
SELECT * FROM public.profiles 
WHERE email = 'EMAIL_DEL_NUEVO_USUARIO_AQUI';
