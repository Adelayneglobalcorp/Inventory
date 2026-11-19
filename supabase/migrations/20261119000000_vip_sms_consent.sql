-- A2P: consentimiento de SMS del cliente (casilla opcional del formulario VIP).
-- Solo se envían SMS al cliente cuando sms_consent = true.
alter table public.vip_orders
  add column if not exists sms_consent boolean not null default false,
  add column if not exists sms_consent_at timestamptz;

-- Reversión (manual):
-- alter table public.vip_orders drop column if exists sms_consent, drop column if exists sms_consent_at;
