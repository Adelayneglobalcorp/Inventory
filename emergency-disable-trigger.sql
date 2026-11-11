-- SOLUCIÓN URGENTE: Error 500 al crear usuarios
-- Paso 1: Deshabilitar trigger problemático

-- Deshabilitar trigger temporalmente
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Verificar que se deshabilitó
SELECT 
  tgname,
  tgenabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname = 'on_auth_user_created';

-- Mensaje de confirmación
SELECT 'Trigger deshabilitado. Ahora puedes crear usuarios.' as status;
