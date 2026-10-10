-- Run this once in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).
-- It sets up username-based login on top of Supabase's native email/password auth:
-- users sign up with a username + password + email, Supabase verifies the email,
-- and login resolves the typed username to its email behind the scenes before
-- calling the normal email/password sign-in.

-- 1) One row per auth user, holding their chosen username.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness ("Jiwon" and "jiwon" are the same username).
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

alter table public.profiles enable row level security;

-- Each user can only see/edit their own profile row directly.
-- (Lookups by other people go through the SECURITY DEFINER functions below,
-- which return only what's needed and nothing else.)
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- 2) Auto-create the profile row right after a new auth user is created,
-- using the username passed in signUp()'s `options.data.username`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Let the signup screen check availability before submitting, so a taken
-- username shows a friendly inline error instead of a failed signUp() call.
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(p_username)
  );
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;

-- 4) Let the login screen resolve "username" -> "email" before calling
-- signInWithPassword(). Returns null if the username doesn't exist, which the
-- app treats the same as a wrong password (never reveal which one was wrong).
create or replace function public.email_for_username(p_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(p_username)
  limit 1;
$$;

grant execute on function public.email_for_username(text) to anon;
