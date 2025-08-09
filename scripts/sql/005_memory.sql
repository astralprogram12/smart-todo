-- Memory table for agent "facts/preferences" with per-user or per-device ownership.
-- Run this in your Supabase SQL editor.

create table if not exists public.memory_entries (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null, -- user id (uuid as text) or device id
  title text not null,
  content text,
  importance int not null default 1 check (importance >= 0 and importance <= 10),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memory_entries_owner_idx on public.memory_entries (owner_key);
create index if not exists memory_entries_updated_idx on public.memory_entries (updated_at desc);
create index if not exists memory_entries_gin_tags_idx on public.memory_entries using gin(tags);

-- Update trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_memory_entries_updated_at on public.memory_entries;
create trigger trg_memory_entries_updated_at
before update on public.memory_entries
for each row execute function public.set_updated_at();

-- Enable RLS (the app accesses via a server route with service role).
alter table public.memory_entries enable row level security;

-- No policies: direct client access is blocked. Server (/api/memory) uses service role and enforces owner_key.
