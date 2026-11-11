-- Forzar tu rol a admin y verificar
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'diegoforerogarzon@gmail.com';

-- Verificar el cambio
SELECT email, role, is_approved, updated_at
FROM public.profiles 
WHERE email = 'diegoforerogarzon@gmail.com';
