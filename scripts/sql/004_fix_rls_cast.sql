-- 004_fix_rls_cast.sql
-- Fix RLS policies by casting auth.uid() (uuid) to text to match device_id column type.
-- Run this AFTER 003_enable_rls.sql.
-- If you later change device_id columns to uuid, recreate these policies without the ::text casts.

-- Drop existing policies (safe to re-run)
drop policy if exists "lists_all_by_owner" on public.lists;
drop policy if exists "tasks_all_by_owner" on public.tasks;

-- Recreate policies with explicit casts
-- Only authenticated users; restrict visibility and writes to rows where device_id matches the user.
create policy "lists_all_by_owner"
on public.lists
as restrictive
for all
to authenticated
using (device_id = (select auth.uid())::text)
with check (device_id = (select auth.uid())::text);

create policy "tasks_all_by_owner"
on public.tasks
as restrictive
for all
to authenticated
using (device_id = (select auth.uid())::text)
with check (device_id = (select auth.uid())::text);

-- Optional: helpful index for performance on device_id filters
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'idx_lists_device_id'
  ) then
    execute 'create index idx_lists_device_id on public.lists (device_id)';
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'idx_tasks_device_id'
  ) then
    execute 'create index idx_tasks_device_id on public.tasks (device_id)';
  end if;
end$$;
