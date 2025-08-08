-- Create lists and tasks tables for anonymous device-based syncing
create table if not exists public.lists (
  id uuid primary key,
  device_id text not null,
  name text not null,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key,
  device_id text not null,
  title text not null,
  notes text,
  due_date date,
  priority text check (priority in ('low','medium','high')),
  difficulty text check (difficulty in ('easy','medium','hard')),
  category text,
  tags text[],
  list_id uuid references public.lists(id) on delete set null,
  status text not null check (status in ('todo','doing','done')) default 'todo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lists_device on public.lists(device_id);
create index if not exists idx_tasks_device on public.tasks(device_id);
create index if not exists idx_tasks_list on public.tasks(list_id);
