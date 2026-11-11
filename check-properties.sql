-- VERIFICAR: Propiedades en la base de datos
-- ====================================================

-- 1. Ver cuántas propiedades existen
SELECT COUNT(*) as total_properties FROM properties;

-- 2. Ver todas las propiedades con sus datos
SELECT 
  id,
  title,
  address,
  city,
  state,
  price,
  status,
  created_at,
  updated_at
FROM properties 
ORDER BY created_at DESC;

-- 3. Ver si hay imágenes para las propiedades
SELECT 
  p.id as property_id,
  p.title,
  COUNT(pi.id) as image_count
FROM properties p
LEFT JOIN property_images pi ON p.id = pi.property_id
GROUP BY p.id, p.title
ORDER BY p.created_at DESC;

-- 4. Verificar si hay datos de ejemplo o mock
SELECT 
  'properties' as table_name,
  COUNT(*) as count
FROM properties
UNION ALL
SELECT 
  'property_images' as table_name,
  COUNT(*) as count
FROM property_images;

-- 5. Ver propiedades por status
SELECT 
  status,
  COUNT(*) as count
FROM properties
GROUP BY status
ORDER BY count DESC;
