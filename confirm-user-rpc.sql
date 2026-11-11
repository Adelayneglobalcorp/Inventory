-- SOLUCIÓN: Funciones RPC para administración de usuarios desde el frontend
-- Estas funciones permiten a los administradores gestionar usuarios sin necesidad
-- de una Service Role Key expuesta en el frontend.

-- Asegurar que las columnas necesarias existan en profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMP WITH TIME ZONE;

-- 1. Función para CONFIRMAR EMAIL
CREATE OR REPLACE FUNCTION public.confirm_user_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'No autorizado.';
  END IF;

  UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = user_id;
  UPDATE public.profiles SET email_confirmed_at = NOW() WHERE id = user_id;
  RETURN TRUE;
END;
$$;

-- 2. Función para ELIMINAR USUARIO COMPLETAMENTE
CREATE OR REPLACE FUNCTION public.delete_user_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'No autorizado.';
  END IF;

  -- Eliminar perfil (opcional si hay cascade, pero aseguramos)
  DELETE FROM public.profiles WHERE id = user_id;
  
  -- Eliminar de auth.users
  DELETE FROM auth.users WHERE id = user_id;
  
  RETURN TRUE;
END;
$$;

-- 3. Dar permisos
GRANT EXECUTE ON FUNCTION public.confirm_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_admin(UUID) TO authenticated;

-- Mensaje de éxito
SELECT 'Funciones de administración (confirmar y eliminar) creadas exitosamente.' as status;
