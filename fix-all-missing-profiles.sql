-- Ver TODOS los usuarios (auth.users vs profiles)
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at,
  p.id as profile_id,
  p.full_name,
  p.role,
  p.is_approved,
  CASE WHEN p.id IS NULL THEN 'SIN PERFIL' ELSE 'CON PERFIL' END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- Crear perfiles faltantes para TODOS los usuarios
INSERT INTO public.profiles (id, email, full_name, role, is_approved, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Usuario'),
  COALESCE(au.raw_user_meta_data->>'role', 'investor'),
  false,
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Verificar resultado
SELECT COUNT(*) as total_profiles FROM public.profiles;
