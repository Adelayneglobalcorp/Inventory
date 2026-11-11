-- Crear tabla para códigos de administrador
CREATE TABLE IF NOT EXISTS public.admin_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_admin_codes_code ON public.admin_codes(code);
CREATE INDEX IF NOT EXISTS idx_admin_codes_user_id ON public.admin_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_codes_is_used ON public.admin_codes(is_used);

-- Función para verificar código de administrador
CREATE OR REPLACE FUNCTION public.verify_admin_code(code TEXT)
RETURNS TABLE(
  valid BOOLEAN,
  user_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    NOT ac.is_used AND (ac.expires_at IS NULL OR ac.expires_at > NOW()) AS valid,
    ac.user_id,
    ac.expires_at
  FROM public.admin_codes ac
  WHERE ac.code = verify_admin_code.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar código como usado
CREATE OR REPLACE FUNCTION public.use_admin_code(code TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.admin_codes 
  SET 
    is_used = TRUE, 
    used_by = user_id, 
    used_at = NOW()
  WHERE code = use_admin_code.code AND NOT is_used;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
