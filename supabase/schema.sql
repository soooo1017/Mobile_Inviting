-- Run this once in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).
-- It sets up username-based login on top of Supabase's native email/password auth:
-- users sign up with a username + password + email, Supabase verifies the email,
-- and login resolves the typed username to its email behind the scenes before
-- calling the normal email/password sign-in.

-- 1) One row per auth user, holding their chosen username and display nickname.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  nickname text,
  created_at timestamptz not null default now()
);

-- Adds the column for projects created before nicknames existed, without
-- touching their existing username/created_at data.
alter table public.profiles add column if not exists nickname text;

-- Case-insensitive uniqueness ("Jiwon" and "jiwon" are the same username).
-- Nicknames are purely for display, so they're allowed to repeat.
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
-- using the username/nickname passed in signUp()'s `options.data`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, nickname)
  values (new.id, new.raw_user_meta_data ->> 'username', new.raw_user_meta_data ->> 'nickname');
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

-- 5) My Page: notification preferences. One row per user, upserted lazily
-- from the app the first time they open 알림 설정 (no row yet just means
-- "use the defaults shown in the UI" — nothing backfills existing users).
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  rsvp_alerts boolean not null default true,
  guestbook_alerts boolean not null default true,
  thanks_transition_alerts boolean not null default true,
  event_schedule_alerts boolean not null default false,
  marketing_alerts boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "notification_preferences: select own" on public.notification_preferences;
create policy "notification_preferences: select own"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "notification_preferences: upsert own" on public.notification_preferences;
create policy "notification_preferences: insert own"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "notification_preferences: update own" on public.notification_preferences;
create policy "notification_preferences: update own"
  on public.notification_preferences for update
  using (auth.uid() = user_id);

-- 6) My Page: 회원 탈퇴 사유. Deliberately has no foreign key to auth.users —
-- the whole point is that this row survives the account it came from being
-- deleted, so product can see *why* people left. No select policy: this is
-- a write-only log the project owner reads from the Supabase dashboard, not
-- something the app reads back.
create table if not exists public.account_deletion_feedback (
  id uuid primary key default gen_random_uuid(),
  reason text not null,
  detail text,
  created_at timestamptz not null default now()
);

alter table public.account_deletion_feedback enable row level security;

drop policy if exists "account_deletion_feedback: insert" on public.account_deletion_feedback;
create policy "account_deletion_feedback: insert"
  on public.account_deletion_feedback for insert
  with check (auth.role() = 'authenticated');

-- 7) My Page: 회원 탈퇴. Deleting a row from auth.users isn't something an
-- "authenticated" client can do directly, and the service-role key that
-- normally allows it must never ship inside the mobile app. A SECURITY
-- DEFINER function sidesteps that: it runs with the privileges of whoever
-- created it (the project owner, via the SQL Editor), and only ever
-- touches the caller's own row (auth.uid()), so granting EXECUTE to
-- "authenticated" is safe — it's a self-delete, not an admin delete.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_own_account() to authenticated;

-- 8) My Page: 문의. 앱에서는 "보내기"와 "내 문의 보기"만 해요. 답변은 앱 안의 관리자 화면이 아니라
-- Supabase 대시보드(Table Editor → inquiries)에서 reply를 적고 status를 'answered'로 바꾸면 돼요
-- (대시보드는 service role이라 아래 RLS를 건너뛰어요). 문의가 많아지면 그때 웹 관리자 화면을 만들어요.
-- 회원 탈퇴 시 그 사람의 문의도 같이 지워지게 auth.users에 연결해 둬요.
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null,
  title text not null,
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'answered')),
  reply text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists inquiries_user_created_idx on public.inquiries (user_id, created_at desc);

alter table public.inquiries enable row level security;

-- 내 문의만 보고, 내 이름으로만 보낼 수 있어요. 고치기 · 지우기는 앱에서 못 해요.
drop policy if exists "inquiries: select own" on public.inquiries;
create policy "inquiries: select own"
  on public.inquiries for select
  using (auth.uid() = user_id);

drop policy if exists "inquiries: insert own" on public.inquiries;
create policy "inquiries: insert own"
  on public.inquiries for insert
  with check (auth.uid() = user_id and status = 'pending' and reply is null);
