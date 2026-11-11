-- ========================================
-- AGREGAR PERMISOS RLS PARA ADMINISTRADORES EN PROPIEDADES
-- ========================================

-- 1. Permitir a los administradores actualizar cualquier propiedad
DROP POLICY IF EXISTS "Admins can update all properties" ON public.properties;
CREATE POLICY "Admins can update all properties"
  ON public.properties FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 2. Permitir a los administradores eliminar cualquier propiedad
DROP POLICY IF EXISTS "Admins can delete all properties" ON public.properties;
CREATE POLICY "Admins can delete all properties"
  ON public.properties FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

SELECT 'Políticas RLS de administrador para propiedades agregadas correctamente' as status;
