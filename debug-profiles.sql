-- Verificar si existen perfiles en la tabla
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Verificar el último usuario creado
SELECT 
  id,
  email,
  full_name,
  role,
  is_approved,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- Verificar si el usuario específico existe (reemplaza con el email del usuario creado)
-- SELECT * FROM public.profiles WHERE email = 'nuevo_usuario@email.com';
