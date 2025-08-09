-- Plans: default free, premium gates WhatsApp verification
create table if not exists public.user_plan (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- WhatsApp connection status (one row per user)
create table if not exists public.user_whatsapp (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  status text not null default 'disconnected' check (status in ('disconnected','pending','connected','failed')),
  wa_connected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- OTP verification log (server-side only; route uses service role, no direct client access)
create table if not exists public.wa_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phone text not null,
  code text not null,
  status text not null default 'pending' check (status in ('pending','verified','failed','expired')),
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Reuse the updated_at trigger if already present from previous scripts
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_user_plan_updated_at on public.user_plan;
create trigger trg_user_plan_updated_at
before update on public.user_plan
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_whatsapp_updated_at on public.user_whatsapp;
create trigger trg_user_whatsapp_updated_at
before update on public.user_whatsapp
for each row execute function public.set_updated_at();

-- Enable RLS for user-owned tables
alter table public.user_plan enable row level security;
alter table public.user_whatsapp enable row level security;
alter table public.wa_verifications enable row level security;

-- Policies: users can read their own plan and whatsapp status; updates to these rows are allowed for the user (optional).
-- Note: API routes use the service role for verification send/verify; these policies allow client to query status if needed.
drop policy if exists "select_own_plan" on public.user_plan;
create policy "select_own_plan"
on public.user_plan
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "select_own_wa" on public.user_whatsapp;
create policy "select_own_wa"
on public.user_whatsapp
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "upsert_own_wa" on public.user_whatsapp;
create policy "upsert_own_wa"
on public.user_whatsapp
for insert
to authenticated
with check (user_id = auth.uid());

create policy "update_own_wa"
on public.user_whatsapp
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- No client policies for wa_verifications (server-only via service role).
