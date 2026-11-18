-- Paquete VIP pagado por Zelle (sitio web oficial global.buycash2day.com)
-- 1) Quien se registra con el paquete VIP (metadata plan = 'vip_495') queda pendiente de pago:
--    no entra a la plataforma hasta que Adelayne confirme el pago.
-- 2) Tabla vip_orders: una orden por persona, con el enlace secreto de aprobación.
-- 3) Recordatorios automáticos (pg_cron cada hora → ghl-events tipo 'vip_reminders').
--
-- Reversión: ver bloque al final del archivo.

-- 1) Aprobación automática, excepto registros VIP -----------------------------
create or replace function public.inventory_auto_approve()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.role is null or new.role = 'pendiente' then
      if exists (
        select 1 from auth.users u
        where u.id = new.id and u.raw_user_meta_data->>'plan' = 'vip_495'
      ) then
        -- Paquete VIP: pendiente hasta confirmar el pago por Zelle.
        new.role := 'pendiente';
        new.is_approved := false;
      else
        new.role := 'usuario';
        new.is_approved := true;
        new.approved_at := coalesce(new.approved_at, now());
      end if;
    end if;
  elsif tg_op = 'UPDATE' then
    -- La app hace un upsert con role 'pendiente' justo después del registro; si el perfil
    -- ya existía aprobado, no se degrada.
    if new.role = 'pendiente' and old.role is distinct from 'pendiente' then
      new.role := old.role;
      new.is_approved := old.is_approved;
      new.approved_at := old.approved_at;
    end if;
  end if;
  return new;
end;
$$;

-- 2) Órdenes VIP ---------------------------------------------------------------
create table if not exists public.vip_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  lang text not null default 'es' check (lang in ('es', 'en')),
  plan text not null default 'vip_495',
  amount numeric not null default 495,
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobado', 'rechazado')),
  approve_token text not null unique,
  reminders_sent int not null default 0,
  contact_id text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  access_until timestamptz
);
-- Solo las funciones del servidor (service_role) leen y escriben esta tabla.
alter table public.vip_orders enable row level security;
revoke all on public.vip_orders from anon, authenticated;

-- 3) Recordatorios ---------------------------------------------------------------
create extension if not exists pg_cron;

create or replace function public.inventory_vip_reminders_tick()
returns void
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  s text;
begin
  if not exists (select 1 from public.vip_orders where status = 'pendiente' and reminders_sent < 2) then
    return;
  end if;
  select decrypted_secret into s from vault.decrypted_secrets where name = 'inventory_webhook_secret';
  if s is null then
    return;
  end if;
  perform net.http_post(
    url := 'https://tfvlgelxqsfyjigteagy.supabase.co/functions/v1/ghl-events',
    body := jsonb_build_object('type', 'vip_reminders', 'id', 'cron'),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-inventory-secret', s),
    timeout_milliseconds := 10000
  );
end;
$$;
revoke all on function public.inventory_vip_reminders_tick() from public, anon, authenticated;

select cron.unschedule('vip-reminders') where exists (select 1 from cron.job where jobname = 'vip-reminders');
select cron.schedule('vip-reminders', '15 * * * *', 'select public.inventory_vip_reminders_tick()');

-- Reversión (manual):
-- select cron.unschedule('vip-reminders');
-- drop function if exists public.inventory_vip_reminders_tick();
-- drop table if exists public.vip_orders;
-- (y volver a la versión anterior de inventory_auto_approve en 20261112190000_ghl_integration.sql)
