-- Script de diagnóstico completo para el login

-- 1. Verificar si tu usuario existe en auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'diegoforerogarzon@gmail.com';

-- 2. Verificar si tu perfil existe en profiles
SELECT 
  id,
  email,
  full_name,
  role,
  is_approved,
  created_at
FROM public.profiles 
WHERE email = 'diegoforerogarzon@gmail.com';

-- 3. Verificar si los IDs coinciden
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  p.id as profile_id,
  p.email as profile_email,
  CASE WHEN au.id = p.id THEN 'IDs coinciden' ELSE 'IDs no coinciden' END as id_match
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'diegoforerogarzon@gmail.com';

-- 4. Verificar si hay errores en el trigger
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 5. Forzar la creación del perfil si no existe
INSERT INTO public.profiles (id, email, full_name, role, is_approved)
SELECT 
  id,
  email,
  'Diego Forero',
  'admin',
  TRUE
FROM auth.users 
WHERE email = 'diegoforerogarzon@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = 'diegoforerogarzon@gmail.com'
  );

-- 6. Confirmar email de auth.users
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'diegoforerogarzon@gmail.com';
