-- ========================================
-- CREAR ADMINISTRADOR - VERSIÓN SIMPLE
-- ========================================
-- Ejecutar en: Supabase Dashboard > SQL Editor

-- PASO 1: Generar UUID para el nuevo usuario
-- Ejecuta esta línea primero y copia el resultado:
SELECT gen_random_uuid() as new_admin_id;

-- PASO 2: Reemplaza 'UUID_AQUI' con el resultado anterior y ejecuta:

-- Crear usuario administrador
INSERT INTO auth.users (
  instance_id,
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'UUID_AQUI', -- <-- REEMPLAZAR CON UUID GENERADO
  'nuevo-admin@ejemplo.com', -- <-- REEMPLAZAR EMAIL
  'REEMPLAZAR_CON_HASH_BCRYPT', -- Generar de forma segura; no reutilizar credenciales de ejemplo
  NOW(),
  NOW(),
  NOW(),
  NOW()
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
-- EJEMPLOS DE CONTRASEÑAS HASH
-- ========================================

-- Genera un hash bcrypt nuevo para cada credencial por un canal seguro.

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Para verificar que el usuario fue creado:
SELECT 
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  p.is_approved
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'nuevo-admin@ejemplo.com'; -- <-- REEMPLAZAR EMAIL
