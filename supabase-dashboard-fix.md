-- INSTRUCCIONES PARA ARREGLAR VIA SUPABASE DASHBOARD
-- ================================================

-- PASO 1: Ir a Supabase Dashboard
-- URL: https://app.supabase.com/project/{tu-project-id}

-- PASO 2: Navegar a Database → Triggers
-- Busca triggers en el schema "auth" en la tabla "users"

-- PASO 3: Si encuentras un trigger "on_auth_user_created" o similar:
-- - Haz clic en "Disable" para desactivarlo temporalmente
-- - O haz clic en "Delete" para eliminarlo

-- PASO 4: Alternativa - Recrear la función del trigger
-- Ve a Database → Functions
-- Busca "handle_new_user" y edítala:

-- CÓDIGO CORREGIDO PARA LA FUNCIÓN:
/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_approved, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'pendiente'),
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
*/

-- PASO 5: Si no puedes acceder a los triggers de auth:
-- Ve a Settings → API → Configura un nuevo webhook
-- O contacta a soporte de Supabase

-- VERIFICACIÓN DESPUÉS DEL ARREGLO:
-- Prueba crear un usuario desde Auth → Users → New User
-- Si funciona, el problema está resuelto

-- EMERGENCIA - Si todo falla:
-- Crea un nuevo proyecto en Supabase y migra los datos
