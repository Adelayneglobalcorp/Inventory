-- Actualizar trigger para asignar rol 'pendiente' por defecto
-- y crear función de aprobación

-- 1. Actualizar valores por defecto en la tabla profiles
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'pendiente';

-- 2. Actualizar usuarios existentes que no tengan rol asignado
UPDATE public.profiles 
SET role = 'pendiente' 
WHERE role IS NULL OR role = '';

-- 3. Eliminar función existente si existe y crear nueva
DROP FUNCTION IF EXISTS public.approve_user(UUID, UUID);

CREATE OR REPLACE FUNCTION public.approve_user(
  user_id UUID,
  approver_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    role = 'usuario',
    is_approved = true,
    approved_by = approver_id,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id AND role = 'pendiente';
  
  RETURN FOUND;
END;
$$;

-- 4. Eliminar función existente si existe y crear nueva
DROP FUNCTION IF EXISTS public.reject_user(UUID, UUID);

CREATE OR REPLACE FUNCTION public.reject_user(
  user_id UUID,
  approver_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    is_approved = false,
    approved_by = approver_id,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

-- 5. Verificar estructura
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- 6. Ver roles actuales
SELECT DISTINCT role, COUNT(*) as count 
FROM public.profiles 
GROUP BY role;
