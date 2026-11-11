-- Financing applications for authenticated Adelayne investors.
-- Review this migration against the live Adelayne schema before applying it.
-- Never run the legacy root-level SQL bundle against production.
create table if not exists public.financing_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  loan_type text not null check (loan_type in ('hard_money', 'dscr')),
  full_name text not null,
  email text not null,
  phone text not null,
  property_address text not null,
  city text not null,
  state text not null,
  postal_code text,
  requested_amount numeric(15,2) not null check (requested_amount > 0),
  purchase_price numeric(15,2) check (purchase_price >= 0),
  rehab_budget numeric(15,2) check (rehab_budget >= 0),
  after_repair_value numeric(15,2) check (after_repair_value >= 0),
  estimated_property_value numeric(15,2) check (estimated_property_value >= 0),
  notes text,
  status text not null default 'pending' check (status in ('pending','in_review','approved','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financing_requests_user_created_idx
on public.financing_requests (user_id, created_at desc);

alter table public.financing_requests enable row level security;
revoke all on public.financing_requests from anon;
grant select, insert, update on public.financing_requests to authenticated;

create policy "Investors can submit their own financing requests"
on public.financing_requests for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'pending');

create policy "Investors can read their own financing requests"
on public.financing_requests for select to authenticated
using (user_id = (select auth.uid()));

create policy "Administrators can read financing requests"
on public.financing_requests for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

create policy "Administrators can update financing requests"
on public.financing_requests for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);
