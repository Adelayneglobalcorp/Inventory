-- Script de diagnóstico y reparación completa

-- 1. Verificar estructura actual de la tabla profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar si tu usuario existe y su estado
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.is_approved,
  p.approved_by,
  p.approved_at,
  au.email_confirmed_at,
  au.created_at as auth_created_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.email = 'diegoforerogarzon@gmail.com';

-- 3. Aprobar tu cuenta manualmente (si no está aprobada)
UPDATE public.profiles 
SET 
  is_approved = TRUE,
  approved_at = NOW()
WHERE email = 'diegoforerogarzon@gmail.com';

-- 4. Confirmar email manualmente
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'diegoforerogarzon@gmail.com';

-- 5. Verificar triggers existentes
SELECT trigger_name, event_manipulation, action_timing, action_condition
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND trigger_schema = 'auth';
