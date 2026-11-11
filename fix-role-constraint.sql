-- FIX: Arreglar constraint profiles_role_check para permitir 'pendiente'
-- ====================================================

-- 1. Verificar el constraint actual
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND conname = 'profiles_role_check';

-- 2. Eliminar el constraint antiguo
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 3. Crear nuevo constraint con todos los roles válidos
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'usuario', 'pendiente', 'investor', 'agent'));

-- 4. Verificar que se creó correctamente
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND conname = 'profiles_role_check';

-- 5. Verificar roles existentes que podrían violar el constraint
SELECT DISTINCT role, COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY role;

-- 6. Mensaje
SELECT 'Constraint actualizado - ahora permite rol pendiente' as status;
