-- Verificar tu rol actual
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
