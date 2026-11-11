-- ========================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA INTERESES
-- ========================================

-- 1. Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view interests in their properties" ON property_interests;
DROP POLICY IF EXISTS "Admins can view all interests" ON property_interests;
DROP POLICY IF EXISTS "Users can add interest to properties" ON property_interests;
DROP POLICY IF EXISTS "Users can update their own interests" ON property_interests;
DROP POLICY IF EXISTS "Admins can update all interests" ON property_interests;
DROP POLICY IF EXISTS "Users can delete their own interests" ON property_interests;
DROP POLICY IF EXISTS "Admins can delete all interests" ON property_interests;

-- 2. Crear políticas más simples y permisivas

-- Política para INSERT (agregar intereses) - más permisiva
CREATE POLICY "Enable insert for all users" ON property_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para SELECT (ver intereses) - admins ven todo, usuarios solo sus propios intereses
CREATE POLICY "Enable select based on role" ON property_interests
  FOR SELECT USING (
    -- Admins pueden ver todo
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    -- Usuarios solo ven sus propios intereses
    auth.uid() = user_id
  );

-- Política para UPDATE - usuarios sus propios intereses, admins todo
CREATE POLICY "Enable update based on role" ON property_interests
  FOR UPDATE USING (
    -- Admins pueden actualizar todo
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    -- Usuarios solo sus propios intereses
    auth.uid() = user_id
  );

-- Política para DELETE - usuarios sus propios intereses, admins todo
CREATE POLICY "Enable delete based on role" ON property_interests
  FOR DELETE USING (
    -- Admins pueden eliminar todo
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    -- Usuarios solo sus propios intereses
    auth.uid() = user_id
  );

-- 3. Confirmación
SELECT 'Políticas RLS corregidas exitosamente' as status;
