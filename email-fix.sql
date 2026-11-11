-- Solución para el error "Email not confirmed"
-- Opción 1: Deshabilitar confirmación de email para usuarios específicos

UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'diegoforerogarzon@gmail.com';

-- Opción 2: Deshabilitar confirmación de email globalmente (solo para desarrollo)
-- Ve a Authentication > Settings > Enable email confirmations = OFF

-- Opción 3: Crear una función para auto-confirmar administradores
CREATE OR REPLACE FUNCTION public.auto_confirm_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirmar email para usuarios con rol admin
  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    UPDATE auth.users 
    SET email_confirmed_at = NOW() 
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auto-confirmación
DROP TRIGGER IF EXISTS auto_confirm_admin_trigger ON auth.users;
CREATE TRIGGER auto_confirm_admin_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_admin();
