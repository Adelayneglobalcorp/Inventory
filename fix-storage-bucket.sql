-- FIX: Verificar bucket property-images y políticas
-- ====================================================

-- 1. Verificar si el bucket existe
SELECT * FROM storage.buckets WHERE name = 'property-images';

-- 2. Si no existe, crearlo
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar políticas del bucket
SELECT * FROM storage.policies WHERE bucket_id = 'property-images';

-- 4. Crear políticas para permitir uploads
DROP POLICY IF EXISTS "Users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;

CREATE POLICY "Users can upload property images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view property images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'property-images');

-- 5. Mensaje
SELECT 'Bucket y políticas configurados para property-images' as status;
