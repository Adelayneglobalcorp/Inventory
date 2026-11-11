-- Modificar tabla de perfiles para incluir estado de aprobación
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Actualizar trigger para no aprobar automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar perfil sin aprobar automáticamente
  INSERT INTO public.profiles (id, email, full_name, role, is_approved)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'investor')::text,
    FALSE -- No aprobado por defecto
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reemplazar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para aprobar usuario
CREATE OR REPLACE FUNCTION public.approve_user(user_id UUID, approved_by UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    is_approved = TRUE,
    approved_by = approve_user.approved_by,
    approved_at = NOW()
  WHERE id = approve_user.user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para rechazar usuario
CREATE OR REPLACE FUNCTION public.reject_user(user_id UUID, rejected_by UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Marcar como rechazado y opcionalmente eliminar
  UPDATE public.profiles 
  SET 
    is_approved = FALSE,
    approved_by = reject_user.rejected_by,
    approved_at = NOW()
  WHERE id = reject_user.user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
