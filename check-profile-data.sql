-- Verificar si tienes datos en la tabla profiles
SELECT 
  id,
  email,
  full_name,
  role,
  is_approved,
  created_at,
  updated_at
FROM public.profiles 
WHERE email = 'diegoforerogarzon@gmail.com';
