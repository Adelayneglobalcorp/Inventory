-- Script de diagnóstico para verificar la estructura de la base de datos
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'auth.users', 'admin_codes')
ORDER BY table_name, ordinal_position;
