-- 003_enable_rls.sql
-- Harden RLS for per-user isolation.
-- Run this after your tables exist (001_create_schema.sql).

-- 1) Enable RLS
alter table if exists public.lists enable row level security;
alter table if exists public.tasks enable row level security;

-- 2) Drop existing policies if you re-run (idempotent-ish)
do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lists') then
    execute 'drop policy if exists "lists_all_by_owner" on public.lists';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tasks') then
    execute 'drop policy if exists "tasks_all_by_owner" on public.tasks';
  end if;
end$$;

-- 3) Policies: Only authenticated users; rows must match auth.uid()
-- Using "for all" ensures SELECT, INSERT, UPDATE, DELETE all obey this rule.
-- USING controls which rows are visible/modifiable; WITH CHECK controls the shape of rows being inserted/updated [^1].
create policy "lists_all_by_owner"
on public.lists
as restrictive
for all
to authenticated
using (device_id = (select auth.uid()))
with check (device_id = (select auth.uid()));

create policy "tasks_all_by_owner"
on public.tasks
as restrictive
for all
to authenticated
using (device_id = (select auth.uid()))
with check (device_id = (select auth.uid()));

-- 4) Deny anon: Do NOT add any policy for role anon. With RLS enabled and no anon policy,
--    anonymous users have zero access to these tables [^1].

-- 5) Optional: if you had data written with device_id that is not an actual auth.uid(),
--    you'll migrate it using the server-side route we add in app/api/migrate/route.ts.
