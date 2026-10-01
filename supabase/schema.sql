-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- It is safe to re-run: every statement is guarded so it will not fail if the
-- table already exists.

create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  -- default auth.uid() means an insert that does not name a user is attributed
  -- to whoever is signed in. The cascade clears a user's rows when they delete
  -- their account, so no orphan data is left behind.
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  tmdb_id int not null,
  title text not null,
  poster_path text,
  status text not null default 'want_to_watch'
    check (status in ('want_to_watch', 'watched')),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  -- One row per movie per user. This is also the conflict target used when
  -- adding a movie that is already on the list.
  unique (user_id, tmdb_id)
);

-- RLS is off by default on new tables from the dashboard, so this line is what
-- turns enforcement on. Without it the anon key could read the whole table.
alter table public.watchlist enable row level security;

-- Every read and write filters on user_id, so an index on it keeps the watchlist
-- page fast as the table grows.
create index if not exists watchlist_user_id_idx on public.watchlist (user_id);

-- One policy covering select, insert, update and delete. `using` decides which
-- existing rows may be read or changed; `with check` decides what a new or
-- updated row is allowed to look like. Both are required -- omitting `with
-- check` would let a user insert a row owned by somebody else.
drop policy if exists "Users can manage their own watchlist" on public.watchlist;

create policy "Users can manage their own watchlist"
  on public.watchlist
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);