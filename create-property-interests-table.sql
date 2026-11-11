-- Tabla para registrar intereses en propiedades
CREATE TABLE IF NOT EXISTS property_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'rejected')),
  notes TEXT,
  UNIQUE(property_id, user_id) -- Un usuario solo puede mostrar interés una vez por propiedad
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_property_interests_property_id ON property_interests(property_id);
CREATE INDEX IF NOT EXISTS idx_property_interests_user_id ON property_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_property_interests_status ON property_interests(status);

-- Políticas de RLS (Row Level Security)
ALTER TABLE property_interests ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver los intereses en sus propias propiedades
CREATE POLICY "Users can view interests in their properties" ON property_interests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_interests.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

-- Política para que los admins puedan ver todos los intereses
CREATE POLICY "Admins can view all interests" ON property_interests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política para que los usuarios registrados puedan agregar interés
CREATE POLICY "Users can add interest to properties" ON property_interests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_id 
      AND properties.status = 'available'
    )
  );

-- Política para que los usuarios puedan actualizar sus propios intereses
CREATE POLICY "Users can update their own interests" ON property_interests
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los admins puedan actualizar todos los intereses
CREATE POLICY "Admins can update all interests" ON property_interests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política para que los usuarios puedan eliminar sus propios intereses
CREATE POLICY "Users can delete their own interests" ON property_interests
  FOR DELETE USING (auth.uid() = user_id);

-- Política para que los admins puedan eliminar todos los intereses
CREATE POLICY "Admins can delete all interests" ON property_interests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
