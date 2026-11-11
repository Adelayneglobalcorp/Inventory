-- ========================================
-- CREAR USUARIO ADMINISTRADOR
-- ========================================
-- Ejecuta este script en tu base de datos de Supabase
-- Usando: Supabase Dashboard > SQL Editor

-- PASO 1: Crear usuario en auth.users
-- NOTA: Reemplaza los valores con los datos del nuevo admin

INSERT INTO auth.users (
  instance_id,
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  phone,
  phone_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  recovery_sent_at,
  email_change_sent_at,
  email_change_token_new,
  email_confirm,
  phone_change,
  phone_change_token,
  phone_confirm,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- instance_id (usualmente este valor)
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', -- ID único del usuario (genera uno nuevo)
  'nuevo-admin@ejemplo.com',             -- Email del nuevo admin
  'encrypted_password_hash',             -- Contraseña encriptada (ver abajo)
  NOW(),                                  -- email_confirmed_at (confirmado inmediatamente)
  NULL,                                   -- phone
  NULL,                                   -- phone_confirmed_at
  NOW(),                                  -- created_at
  NOW(),                                  -- updated_at
  NULL,                                   -- last_sign_in_at
  NULL,                                   -- recovery_sent_at
  NULL,                                   -- email_change_sent_at
  NULL,                                   -- email_change_token_new
  NULL,                                   -- email_confirm
  NULL,                                   -- phone_change
  NULL,                                   -- phone_change_token
  NULL,                                   -- phone_confirm
  0,                                      -- email_change_confirm_status
  NULL,                                   -- banned_until
  NULL,                                   -- reauthentication_token
  NULL,                                   -- reauthentication_sent_at
  false,                                  -- is_sso_user
  NULL                                    -- deleted_at
);

-- PASO 2: Crear perfil en la tabla profiles
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  is_approved,
  approved_by,
  approved_at,
  created_at,
  updated_at
) VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', -- MISMO ID que en auth.users
  'nuevo-admin@ejemplo.com',             -- MISMO email
  'Nombre del Administrador',            -- Nombre completo
  'admin',                                -- Rol de administrador
  true,                                   -- Aprobado inmediatamente
  '972a4c4f-ae4c-4eff-8721-4009033a9585', -- ID del admin que aprueba (tu ID)
  NOW(),                                  -- Fecha de aprobación
  NOW(),                                  -- created_at
  NOW()                                   -- updated_at
);

-- ========================================
-- VERSIÓN SIMPLIFICADA (más fácil de ejecutar)
-- ========================================

-- Para generar un UUID válido, usa: SELECT gen_random_uuid()
-- Para generar un hash de contraseña, necesitas el hash bcrypt

-- EJEMPLO CON DATOS REALES:
-- (Reemplaza los valores xxxxxxxx con UUIDs generados)

-- 1. Primero genera un UUID para el nuevo usuario:
SELECT gen_random_uuid() as new_user_id; -- Copia este resultado

-- 2. Luego ejecuta las inserciones con los UUIDs generados:

-- Usuario admin de ejemplo:
INSERT INTO auth.users (
  instance_id,
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'TU_UUID_GENERADO_AQUI',
  'admin@tuempresa.com',
  'REEMPLAZAR_CON_HASH_BCRYPT', -- Generar de forma segura; no reutilizar credenciales de ejemplo
  NOW(),
  NOW(),
  NOW()
);

-- Perfil del admin:
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  is_approved,
  approved_by,
  approved_at,
  created_at,
  updated_at
) VALUES (
  'TU_UUID_GENERADO_AQUI', -- MISMO UUID
  'admin@tuempresa.com',
  'Administrador Principal',
  'admin',
  true,
  '972a4c4f-ae4c-4eff-8721-4009033a9585', -- Tu ID de admin
  NOW(),
  NOW(),
  NOW()
);

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Verificar que el usuario fue creado correctamente:
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  p.is_approved
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@tuempresa.com';
