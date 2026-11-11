-- ========================================
-- CREAR ADMINISTRADOR - VERSIÓN CORREGIDA
-- ========================================
-- Script actualizado con la estructura correcta de auth.users de Supabase

-- PASO 1: Generar UUID para el nuevo usuario
-- Ejecuta esta línea primero y copia el resultado:
SELECT gen_random_uuid() as new_admin_id;

-- PASO 2: Reemplaza 'UUID_AQUI' con el resultado anterior y ejecuta:

-- Crear usuario en auth.users (versión corregida)
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
  phone_change,
  phone_change_token,
  phone_confirm,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  invited_at,
  confirmation_token,
  email_change_token_current,
  email_change_confirm_status_new,
  email_change_email_new
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'UUID_AQUI', -- <-- REEMPLAZAR CON UUID GENERADO
  'nuevo-admin@ejemplo.com', -- <-- REEMPLAZAR EMAIL
  'REEMPLAZAR_CON_HASH_BCRYPT', -- Generar de forma segura; no reutilizar credenciales de ejemplo
  NOW(),
  NULL,
  NULL,
  NOW(),
  NOW(),
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  0,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  NULL,
  NULL,
  NULL,
  0,
  NULL
);

-- PASO 3: Crear perfil del administrador
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
  'UUID_AQUI', -- <-- MISMO UUID DE ARRIBA
  'nuevo-admin@ejemplo.com', -- <-- MISMO EMAIL
  'Nombre del Admin', -- <-- REEMPLAZAR NOMBRE
  'admin',
  true,
  '972a4c4f-ae4c-4eff-8721-4009033a9585', -- Tu ID de admin actual
  NOW(),
  NOW(),
  NOW()
);

-- ========================================
-- VERSIÓN MÁS SIMPLE (solo columnas necesarias)
-- ========================================

-- Si el anterior falla, prueba esta versión mínima:
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  'UUID_AQUI',
  'nuevo-admin@ejemplo.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm',
  NOW(),
  NOW(),
  NOW()
);

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Para verificar que el usuario fue creado:
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  p.is_approved
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'nuevo-admin@ejemplo.com'; -- <-- REEMPLAZAR EMAIL

-- ========================================
-- CONTRASEÑAS DISPONIBLES
-- ========================================

-- Genera un hash bcrypt nuevo para cada credencial por un canal seguro.
