-- Forzar actualización de rol y aprobar tu cuenta
UPDATE public.profiles 
SET 
  role = 'admin',
  is_approved = TRUE,
  approved_at = NOW()
WHERE email = 'diegoforerogarzon@gmail.com';

-- Verificar la actualización
SELECT 
  email, 
  role, 
  is_approved,
  approved_at,
  updated_at
FROM public.profiles 
WHERE email = 'diegoforerogarzon@gmail.com';
