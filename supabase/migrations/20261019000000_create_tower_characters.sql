create table if not exists public.tower_characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 32),
  job_file text not null default 'Cavaleiros Rúnicospartyicn.png',
  last_done_date date,
  created_at timestamptz not null default now()
);

create index if not exists tower_characters_user_id_created_at_idx
  on public.tower_characters (user_id, created_at);

grant select, insert, update, delete on public.tower_characters to authenticated;

alter table public.tower_characters enable row level security;

drop policy if exists "Users can read their own tower characters" on public.tower_characters;
drop policy if exists "Users can create their own tower characters" on public.tower_characters;
drop policy if exists "Users can update their own tower characters" on public.tower_characters;
drop policy if exists "Users can delete their own tower characters" on public.tower_characters;

create policy "Users can read their own tower characters"
  on public.tower_characters for select
  using ((select auth.uid()) = user_id);

create policy "Users can create their own tower characters"
  on public.tower_characters for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own tower characters"
  on public.tower_characters for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own tower characters"
  on public.tower_characters for delete
  using ((select auth.uid()) = user_id);