-- Integración Inventory ↔ GoHighLevel (BuyCash 2day)
-- 1) Idioma preferido del usuario.
-- 2) Acceso inmediato: los registros generales quedan aprobados (los admin no se tocan y
--    los rechazos que hace un administrador se respetan).
-- 3) Disparadores que envían los eventos (registro, interés, financiamiento) a la función
--    ghl-events mediante pg_net. Nunca bloquean la operación original.
-- El secreto compartido se guarda aparte en Vault con el nombre 'inventory_webhook_secret'
-- (no se versiona en git).
--
-- Reversión: ver bloque al final del archivo.

create extension if not exists pg_net with schema extensions;

-- 1) Idioma ---------------------------------------------------------------
alter table public.profiles
  add column if not exists preferred_language text
  check (preferred_language is null or preferred_language in ('es', 'en'));

-- 2) Acceso inmediato --------------------------------------------------------
create or replace function public.inventory_auto_approve()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.role is null or new.role = 'pendiente' then
      new.role := 'usuario';
      new.is_approved := true;
      new.approved_at := coalesce(new.approved_at, now());
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

drop trigger if exists inventory_auto_approve on public.profiles;
create trigger inventory_auto_approve
  before insert or update on public.profiles
  for each row execute function public.inventory_auto_approve();

-- 3) Eventos hacia GHL -------------------------------------------------------
create or replace function public.inventory_webhook_secret_ok(p text)
returns boolean
language sql
security definer
set search_path = public, vault
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'inventory_webhook_secret' and decrypted_secret = p
  );
$$;
revoke all on function public.inventory_webhook_secret_ok(text) from public, anon, authenticated;
grant execute on function public.inventory_webhook_secret_ok(text) to service_role;

create or replace function public.inventory_emit_event()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  s text;
begin
  select decrypted_secret into s from vault.decrypted_secrets where name = 'inventory_webhook_secret';
  if s is null then
    return new;
  end if;
  perform net.http_post(
    url := 'https://tfvlgelxqsfyjigteagy.supabase.co/functions/v1/ghl-events',
    body := jsonb_build_object('type', tg_argv[0], 'id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-inventory-secret', s),
    timeout_milliseconds := 10000
  );
  return new;
exception when others then
  raise log 'inventory_emit_event % falló: %', tg_argv[0], sqlerrm;
  return new;
end;
$$;
revoke all on function public.inventory_emit_event() from public, anon, authenticated;

drop trigger if exists inventory_evt_registration on auth.users;
create trigger inventory_evt_registration
  after insert on auth.users
  for each row execute function public.inventory_emit_event('registration');

drop trigger if exists inventory_evt_interest on public.property_interests;
create trigger inventory_evt_interest
  after insert on public.property_interests
  for each row execute function public.inventory_emit_event('interest');

drop trigger if exists inventory_evt_financing on public.financing_requests;
create trigger inventory_evt_financing
  after insert on public.financing_requests
  for each row execute function public.inventory_emit_event('financing');

-- Reversión (manual):
-- drop trigger if exists inventory_evt_registration on auth.users;
-- drop trigger if exists inventory_evt_interest on public.property_interests;
-- drop trigger if exists inventory_evt_financing on public.financing_requests;
-- drop trigger if exists inventory_auto_approve on public.profiles;
-- drop function if exists public.inventory_emit_event();
-- drop function if exists public.inventory_webhook_secret_ok(text);
-- drop function if exists public.inventory_auto_approve();
-- alter table public.profiles drop column if exists preferred_language;
