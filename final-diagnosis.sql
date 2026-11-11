-- DIAGNÓSTICO FINAL: Error 500 persistente en signup
-- Esto indica un problema serio en el backend de Supabase

-- 1. Verificar si hay algún trigger que podemos desactivar
-- (Requiere permisos de owner, probablemente fallará)
SELECT 
  tgname,
  tgenabled,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;

-- 2. Verificar si la tabla profiles tiene algún problema
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar constraints en profiles
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;

-- 4. Intentar reparar trigger (solo si tienes permisos)
-- Esta sección probablemente falle sin ser owner

-- SOLUCIÓN ALTERNATIVA VIA DASHBOARD:
-- Si no puedes ejecutar SQL en auth.users, ve a:
-- 1. Supabase Dashboard → Database → Triggers
-- 2. Busca triggers en "auth" schema
-- 3. Desactiva cualquier trigger en "users" table
-- 4. O elimina y recrea el trigger problemático

-- SOLUCIÓN NUCLEAR (solo si todo falla):
-- Recrear la tabla profiles desde cero
/*
-- ATENCIÓN: Esto eliminará TODOS los datos de perfiles
-- Haz backup primero!

DROP TABLE IF EXISTS public.profiles;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  company TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'pendiente',
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Política para admins (ver todos)
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));
*/

-- Mensaje informativo
SELECT 
  'Error 500 persistente. Posibles causas:' as issue,
  '1. Trigger defectuoso en auth.users' as cause_1,
  '2. Constraint violation en profiles' as cause_2,
  '3. Problema de permisos RLS' as cause_3,
  'Solución: Revisar Supabase Dashboard → Database → Triggers' as solution;
