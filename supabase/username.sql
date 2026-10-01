-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- It is safe to re-run: every statement is guarded so it will not fail if the
-- table, policy, or trigger already exist.

create table if not exists public.profiles (
  -- The id is the auth user id, so a profile cannot exist without an account and
  -- the cascade removes it when the account is deleted.
  id uuid primary key references auth.users (id) on delete cascade,
  -- Stored exactly as the person typed it. Comparison always goes through
  -- lower(username), so "Alice" and "alice" cannot both be claimed.
  username text not null,
  created_at timestamptz not null default now(),
  -- Length and alphabet are enforced by the database as well as the form, so a
  -- crafted Server Action request cannot insert a name the UI would reject.
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_]{3,20}$')
);

-- RLS is off by default on tables created from the dashboard, so this line is
-- what turns enforcement on.
alter table public.profiles enable row level security;

-- This index is the actual uniqueness guarantee. A plain unique (username)
-- would treat "Alice" and "alice" as different names.
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

-- One policy, SELECT only. A user may read their own row -- that is all the
-- header needs -- and nothing else: there is no insert, update, or delete
-- policy, so this table is not writable from the browser at all. Rows are
-- created by the trigger below, not by the client.
drop policy if exists "Users can read their own profile" on public.profiles;

create policy "Users can read their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- security definer: the trigger has to insert a row the caller could not insert
-- themselves, since the table has no INSERT policy.
-- set search_path = '': with an empty search path nothing resolves implicitly,
-- so every name below is schema-qualified and cannot be hijacked.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- The app passes the username through signUp's options.data, which lands in
  -- raw_user_meta_data. A null here fails the NOT NULL constraint, which is
  -- what makes the username field mandatory in practice.
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Optional backfill, for accounts created BEFORE this script was run: they have
-- no profile row, so they cannot log in with a username yet. Run it yourself --
-- it is left commented out on purpose, because it writes a placeholder name
-- that your users did not choose. Anyone who wants a real username has to be
-- given a way to change it, which this project does not have.
--
-- insert into public.profiles (id, username)
-- select id, 'user_' || left(id::text, 8)
-- from auth.users
-- on conflict do nothing;
