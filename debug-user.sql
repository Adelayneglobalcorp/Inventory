-- Verificar tu estado actual en la base de datos
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.is_approved,
  p.created_at,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.email = 'diegoforerogarzon@gmail.com';
