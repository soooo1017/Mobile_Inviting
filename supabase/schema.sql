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

drop policy if exists "notification_preferences: insert own" on public.notification_preferences;
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9) 하객용 웹 페이지 · 서버 저장 (2026-11-10)  — docs/SERVER_STORAGE.md §13
--
-- 방식: 초대장은 만들 때부터 서버에 "내 것"으로 저장돼요(작성 중 = draft, 하객에게는 안 보임). 고칠 때마다 자동으로 반영되고,
-- 폰을 바꿔도 로그인하면 이어서 고칠 수 있어요. [공유 시작]을 누르면 하객에게 열려요(shared), 중지하면 닫혀요(stopped).
-- 두 기기가 동시에 고치면 rev(수정 번호)로 알아채요. 하객은 로그인 없이 링크만 열어요. 하객이 쓰는 건 아래 함수(RPC)로만 해서 표를 직접 읽거나 쓰지 못하게 막아요.
-- 이 부분은 여러 번 실행해도 안전해요(이미 있으면 건너뛰거나 덮어써요).
-- ═══════════════════════════════════════════════════════════════════════════════

-- 9-1) 초대장 — 만든 초대장 하나당 한 줄. 작성 중(draft)도 서버에 있어서 폰을 바꿔도 이어서 고칠 수 있어요.
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  -- 폰 안에서 쓰는 초대장 번호. 같은 초대장을 다시 올릴 때(올리다 끊겨 다시 시도 등) 한 줄로 합치려고 둬요.
  local_id text not null,
  -- 링크 주소(https://도메인/i/<slug>). 서버 전체에서 하나뿐이에요. 앱이 만든 영문 소문자 · 숫자 · - 만 허용.
  -- 만들 때 바로 자리를 잡아서 QR · 홍보물 링크가 겹치지 않아요. 공유를 시작하기 전(draft)까지만 바꿀 수 있어요.
  slug text not null check (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' and char_length(slug) between 4 and 40),
  title text not null,
  event_type text not null,
  event_at timestamptz not null,
  -- 초대장 내용 전체(글 · 사진 주소 · 배경음악 설정 · 색 · 글꼴 · 안내 팝업). 항목 종류가 늘어도 표는 그대로예요.
  content jsonb not null default '{}'::jsonb,
  -- 감사페이지 설정과 내용
  thanks jsonb not null default '{}'::jsonb,
  -- 다른 폰에서 이어서 고칠 때 필요한 나머지 설정(호스트 · 장소 · 링크 방식 · 공유 옵션 등). 하객에게는 안 보내요.
  meta jsonb not null default '{}'::jsonb,
  -- draft = 작성 중(만든 사람만 봐요, 링크는 "준비 중") / shared = 공유 중(링크가 열려요, 고치면 바로 반영)
  -- stopped = 공유 중지(링크는 "공유가 끝났어요")
  status text not null default 'draft' check (status in ('draft', 'shared', 'stopped')),
  shared_at timestamptz,
  -- 수정 번호: 고칠 때마다 1씩 올라가요. 사용자에게는 안 보이는 안전장치예요 — 앱은 "내가 본 번호"가 그대로일 때만 저장해서(where rev = …)
  -- 편집 잠금(9-1b)이 어긋난 드문 경우에도 다른 폰의 내용을 덮어쓰지 않아요.
  rev integer not null default 1,
  -- 마지막으로 고친 기기(앱이 정한 이름 · 번호) — "다른 기기에서 수정했어요" 안내용
  last_device text,
  -- 서버에서 지워지는 날 = 행사일 + 1년 (아래 트리거가 계산해요 — 앱이 바꿀 수 없어요)
  expires_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, local_id)
);

create unique index if not exists invitations_slug_idx on public.invitations (slug);
create index if not exists invitations_owner_idx on public.invitations (owner_id, updated_at desc);
create index if not exists invitations_expires_idx on public.invitations (expires_at);

create or replace function public.invitations_before_write()
returns trigger
language plpgsql
as $$
begin
  new.expires_at := new.event_at + interval '1 year';
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.rev := old.rev + 1;
    new.owner_id := old.owner_id;
    new.local_id := old.local_id;
    -- 링크 주소는 공유를 시작하기 전(draft)까지만 바꿀 수 있어요. 한 번 시작하면 중지해도 영구 고정.
    if old.status <> 'draft' then
      new.slug := old.slug;
    end if;
    -- 공유를 처음 시작한 시각
    if old.status = 'draft' and new.status = 'shared' and new.shared_at is null then
      new.shared_at := now();
    end if;
    -- 한 번 공유한 초대장을 다시 작성 중(draft)으로 되돌릴 수는 없어요(링크가 이미 퍼졌어요).
    if old.status <> 'draft' and new.status = 'draft' then
      new.status := old.status;
    end if;
  elsif new.status = 'shared' and new.shared_at is null then
    new.shared_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists invitations_before_write_trg on public.invitations;
create trigger invitations_before_write_trg
  before insert or update on public.invitations
  for each row execute function public.invitations_before_write();

alter table public.invitations enable row level security;

-- 만든 사람만 자기 초대장을 읽고 · 올리고 · 고치고 · 지워요. 하객은 이 표를 직접 못 봐요(아래 함수로만).
drop policy if exists "invitations: select own" on public.invitations;
create policy "invitations: select own" on public.invitations for select using (auth.uid() = owner_id);
drop policy if exists "invitations: insert own" on public.invitations;
create policy "invitations: insert own" on public.invitations for insert with check (auth.uid() = owner_id);
drop policy if exists "invitations: update own" on public.invitations;
create policy "invitations: update own" on public.invitations for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "invitations: delete own" on public.invitations;
create policy "invitations: delete own" on public.invitations for delete using (auth.uid() = owner_id);

-- 9-1b) 편집 잠금 — 한 초대장은 한 번에 한 기기에서만 고쳐요(내용이 섞이는 충돌을 아예 없애려고).
-- 로그인은 여러 폰에서 되고, "편집"만 한 기기가 잡아요. 앱이 30초마다 같은 기기 이름으로 다시 불러서(heartbeat) 이어 가요.
-- 2분 동안 소식이 없으면(앱이 꺼짐 등) 저절로 풀려서 다른 폰이 바로 가져갈 수 있어요.
create table if not exists public.invitation_edit_locks (
  invitation_id uuid primary key references public.invitations (id) on delete cascade,
  device text not null,
  until timestamptz not null
);
alter table public.invitation_edit_locks enable row level security;
drop policy if exists "edit locks: select own invitation" on public.invitation_edit_locks;
create policy "edit locks: select own invitation" on public.invitation_edit_locks for select
  using (exists (select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()));

-- 편집권 잡기 · 유지 · 넘겨받기. 돌려주는 값: {ok: true} 또는 {ok: false, device, until}(다른 기기가 편집 중).
--  · 비었거나 · 만료됐거나 · 내 기기가 이미 잡고 있으면 → 내가 잡아요(ok: true).
--  · 다른 기기가 편집 중이면 → ok: false. 사용자가 [여기서 편집하기]를 누르면 p_takeover = true로 다시 불러서 넘겨받아요.
create or replace function public.claim_edit(p_invitation uuid, p_device text, p_takeover boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  lock_row public.invitation_edit_locks;
  prev_device text;
begin
  if not exists (select 1 from public.invitations where id = p_invitation and owner_id = auth.uid()) then
    raise exception '내 초대장이 아니에요' using errcode = 'P0003';
  end if;
  select * into lock_row from public.invitation_edit_locks where invitation_id = p_invitation for update;
  if found and lock_row.until > now() and lock_row.device <> p_device and not coalesce(p_takeover, false) then
    return jsonb_build_object('ok', false, 'device', lock_row.device, 'until', lock_row.until);
  end if;
  prev_device := case when found and lock_row.until > now() and lock_row.device <> p_device then lock_row.device end;
  insert into public.invitation_edit_locks (invitation_id, device, until)
  values (p_invitation, p_device, now() + interval '2 minutes')
  on conflict (invitation_id) do update set device = excluded.device, until = excluded.until;
  return jsonb_build_object('ok', true, 'took_over_from', prev_device);
end;
$$;

create or replace function public.release_edit(p_invitation uuid, p_device text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.invitation_edit_locks l
  using public.invitations i
  where l.invitation_id = p_invitation and l.device = p_device and i.id = l.invitation_id and i.owner_id = auth.uid();
$$;

revoke all on function public.claim_edit(uuid, text, boolean) from public, anon;
revoke all on function public.release_edit(uuid, text) from public, anon;
grant execute on function public.claim_edit(uuid, text, boolean) to authenticated;
grant execute on function public.release_edit(uuid, text) to authenticated;

-- 9-2) 참석 응답 — 하객이 남기고, 만든 사람만 읽어요.
create table if not exists public.rsvp_responses (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  -- 같은 기기에서 같은 사람이 다시 보내면 덮어써요(마지막 응답이 유효). 하객 브라우저가 만든 무작위 번호이고 이름 · 연락처와 무관해요.
  visitor_id uuid not null,
  name text not null check (char_length(name) between 1 and 40),
  attending boolean not null,
  side smallint check (side in (0, 1)),
  companions smallint not null default 0 check (companions between 0 and 20),
  meal boolean,
  phone text check (char_length(phone) <= 30),
  message text check (char_length(message) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invitation_id, visitor_id)
);
create index if not exists rsvp_invitation_idx on public.rsvp_responses (invitation_id, updated_at desc);

alter table public.rsvp_responses enable row level security;
drop policy if exists "rsvp: select own invitation" on public.rsvp_responses;
create policy "rsvp: select own invitation" on public.rsvp_responses for select
  using (exists (select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()));

-- 9-3) 방명록 — 하객이 남기고, 만든 사람은 읽고 지워요. "우리만 보기"는 하객에게 안 보여요.
create table if not exists public.guestbook_posts (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  visitor_id uuid not null,
  name text not null check (char_length(name) between 1 and 40),
  side smallint check (side in (0, 1)),
  body text not null check (char_length(body) between 1 and 1000),
  secret boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists guestbook_invitation_idx on public.guestbook_posts (invitation_id, created_at desc);

alter table public.guestbook_posts enable row level security;
drop policy if exists "guestbook: select own invitation" on public.guestbook_posts;
create policy "guestbook: select own invitation" on public.guestbook_posts for select
  using (exists (select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()));
drop policy if exists "guestbook: delete own invitation" on public.guestbook_posts;
create policy "guestbook: delete own invitation" on public.guestbook_posts for delete
  using (exists (select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()));

-- 9-4) 방문 통계 — 개인정보 없는 익명 숫자. 방문한 사람 = visitor_id 수(같은 기기는 1명), 열어본 횟수 = open_count 합.
create table if not exists public.invitation_visits (
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  visitor_id uuid not null,
  open_count integer not null default 1,
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  primary key (invitation_id, visitor_id)
);

alter table public.invitation_visits enable row level security;
drop policy if exists "visits: select own invitation" on public.invitation_visits;
create policy "visits: select own invitation" on public.invitation_visits for select
  using (exists (select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()));

-- 9-5) 하객용 함수 — 로그인 없이(anon) 쓸 수 있고, 표 대신 이 함수가 검사하고 읽고 써요.
-- "열려 있는 초대장" = 공유 중(shared)이고 아직 만료되지 않은 것.
create or replace function public.get_public_invitation(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  inv public.invitations;
begin
  select * into inv from public.invitations where slug = lower(p_slug);
  if not found then
    -- 없는 주소와 작성 중인 주소를 똑같이 "준비 중"으로 돌려줘요 — 주소를 이것저것 넣어 보면서 누가 쓰는 주소인지 알아내지 못하게.
    return jsonb_build_object('state', 'preparing');
  end if;
  if inv.expires_at < now() then
    return jsonb_build_object('state', 'ended');
  end if;
  if inv.status = 'draft' then
    return jsonb_build_object('state', 'preparing');
  end if;
  if inv.status <> 'shared' then
    return jsonb_build_object('state', 'stopped');
  end if;
  return jsonb_build_object(
    'state', 'live',
    'id', inv.id,
    'title', inv.title,
    'event_type', inv.event_type,
    'event_at', inv.event_at,
    'content', inv.content,
    'thanks', inv.thanks,
    'updated_at', inv.updated_at
  );
end;
$$;

-- 하객이 남긴 응답 · 글이 너무 많이 쌓이지 않게: 같은 기기가 한 시간에 5번까지만 남길 수 있어요.
create or replace function public.submit_rsvp(
  p_slug text, p_visitor uuid, p_name text, p_attending boolean,
  p_side smallint default null, p_companions smallint default 0, p_meal boolean default null,
  p_phone text default null, p_message text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv_id uuid;
begin
  select id into inv_id from public.invitations
    where slug = lower(p_slug) and status = 'shared' and expires_at >= now();
  if inv_id is null then
    raise exception '열려 있지 않은 초대장이에요' using errcode = 'P0001';
  end if;
  if (select count(*) from public.rsvp_responses
        where invitation_id = inv_id and visitor_id = p_visitor and updated_at > now() - interval '1 hour') >= 5 then
    raise exception '잠시 뒤에 다시 시도해 주세요' using errcode = 'P0002';
  end if;
  insert into public.rsvp_responses (invitation_id, visitor_id, name, attending, side, companions, meal, phone, message)
  values (inv_id, p_visitor, trim(p_name), p_attending, p_side, coalesce(p_companions, 0), p_meal, nullif(trim(p_phone), ''), nullif(trim(p_message), ''))
  on conflict (invitation_id, visitor_id) do update
    set name = excluded.name, attending = excluded.attending, side = excluded.side, companions = excluded.companions,
        meal = excluded.meal, phone = excluded.phone, message = excluded.message, updated_at = now();
end;
$$;

create or replace function public.post_guestbook(
  p_slug text, p_visitor uuid, p_name text, p_body text,
  p_side smallint default null, p_secret boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv_id uuid;
begin
  select id into inv_id from public.invitations
    where slug = lower(p_slug) and status = 'shared' and expires_at >= now();
  if inv_id is null then
    raise exception '열려 있지 않은 초대장이에요' using errcode = 'P0001';
  end if;
  if (select count(*) from public.guestbook_posts
        where invitation_id = inv_id and visitor_id = p_visitor and created_at > now() - interval '1 hour') >= 5 then
    raise exception '잠시 뒤에 다시 시도해 주세요' using errcode = 'P0002';
  end if;
  insert into public.guestbook_posts (invitation_id, visitor_id, name, side, body, secret)
  values (inv_id, p_visitor, trim(p_name), p_side, trim(p_body), coalesce(p_secret, false));
end;
$$;

-- 하객에게 보여주는 방명록: 공개 글만, 최근 순. 기기 번호(visitor_id)는 돌려주지 않아요.
create or replace function public.list_guestbook(p_slug text, p_limit integer default 50)
returns table (id uuid, name text, side smallint, body text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select g.id, g.name, g.side, g.body, g.created_at
  from public.guestbook_posts g
  join public.invitations i on i.id = g.invitation_id
  where i.slug = lower(p_slug) and i.status = 'shared' and i.expires_at >= now() and not g.secret
  order by g.created_at desc
  limit least(greatest(p_limit, 1), 200);
$$;

-- 방문 기록: 열려 있는 초대장일 때만 세요(공유 전 · 중지 후 방문은 세지 않아요).
create or replace function public.record_visit(p_slug text, p_visitor uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv_id uuid;
begin
  select id into inv_id from public.invitations
    where slug = lower(p_slug) and status = 'shared' and expires_at >= now();
  if inv_id is null then
    return;
  end if;
  insert into public.invitation_visits (invitation_id, visitor_id) values (inv_id, p_visitor)
  on conflict (invitation_id, visitor_id) do update set open_count = public.invitation_visits.open_count + 1, last_at = now();
end;
$$;

revoke all on function public.get_public_invitation(text) from public;
revoke all on function public.submit_rsvp(text, uuid, text, boolean, smallint, smallint, boolean, text, text) from public;
revoke all on function public.post_guestbook(text, uuid, text, text, smallint, boolean) from public;
revoke all on function public.list_guestbook(text, integer) from public;
revoke all on function public.record_visit(text, uuid) from public;
grant execute on function public.get_public_invitation(text) to anon, authenticated;
grant execute on function public.submit_rsvp(text, uuid, text, boolean, smallint, smallint, boolean, text, text) to anon, authenticated;
grant execute on function public.post_guestbook(text, uuid, text, text, smallint, boolean) to anon, authenticated;
grant execute on function public.list_guestbook(text, integer) to anon, authenticated;
grant execute on function public.record_visit(text, uuid) to anon, authenticated;

-- 9-6) 만료된 초대장 지우기 — 응답 · 방명록 · 방문 기록은 같이 지워져요(on delete cascade).
-- 사진 · 음악 파일은 SQL로는 실제 파일이 안 지워져서, 나중에 Edge Function으로 따로 지워요(SERVER_STORAGE.md §13).
-- 하루 한 번 돌리려면 Dashboard → Database → Extensions에서 pg_cron을 켠 뒤 아래 주석을 풀어 한 번 실행해요.
create or replace function public.purge_expired_invitations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.invitations where expires_at < now();
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.purge_expired_invitations() from public, anon, authenticated;

-- 오래 손대지 않은 작성 중(draft) 초대장 정리 — 사진 · 음악 공간을 아끼려고, 90일 동안 수정이 없으면 지워요.
-- (앱이 지우기 2주 전부터 "곧 지워져요" 안내를 보여줘요. 공유한 적 있는 초대장은 여기서 지우지 않아요.)
create or replace function public.purge_stale_drafts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.invitations where status = 'draft' and updated_at < now() - interval '90 days';
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.purge_stale_drafts() from public, anon, authenticated;

-- select cron.schedule('purge-expired-invitations', '0 18 * * *', $$select public.purge_expired_invitations()$$);  -- 매일 03:00 (한국 시간)
-- select cron.schedule('purge-stale-drafts', '10 18 * * *', $$select public.purge_stale_drafts()$$);

-- 9-7) 사진 · 음악 보관함(Storage).
--  · invitation-media: 만든 사람이 올린 사진 · 내 음악. 하객이 볼 수 있게 공개 주소로 읽고, 올리기 · 지우기는 자기 폴더(<내 user id>/…)만.
--    파일 경로 규칙: <user id>/<초대장 local_id>/<사진 번호>.jpg — 바꾸거나 지운 사진은 앱이 저장에 성공한 뒤 바로 지우고, 놓친 파일은 나중에 Edge Function이 정리해요.
--  · bgm: 앱이 제공하는 배경음악(bgm001.mp3 …). 운영자가 Dashboard → Storage에서 직접 올려요(앱은 읽기만).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('invitation-media', 'invitation-media', true, 15728640,
   array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/m4a']),
  ('bgm', 'bgm', true, 15728640, array['audio/mpeg'])
on conflict (id) do nothing;

-- 자기 폴더의 파일 목록은 볼 수 있어야 해요(앱이 놓친 파일을 정리하고, 아래 개수 한도가 자기 파일 수를 셀 수 있게). 하객은 목록은 못 보고 공개 주소로 파일만 받아요.
drop policy if exists "invitation-media: list own folder" on storage.objects;
create policy "invitation-media: list own folder" on storage.objects for select to authenticated
  using (bucket_id = 'invitation-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "invitation-media: upload own folder" on storage.objects;
create policy "invitation-media: upload own folder" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'invitation-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    -- 한 사람이 올릴 수 있는 파일 수의 안전 한도(500개). 앱이 정한 사진 개수 제한을 우회해도 서버 공간이 무한히 차지 않게 해요.
    and (select count(*) from storage.objects o
         where o.bucket_id = 'invitation-media' and (storage.foldername(o.name))[1] = auth.uid()::text) < 500
  );
drop policy if exists "invitation-media: update own folder" on storage.objects;
create policy "invitation-media: update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'invitation-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "invitation-media: delete own folder" on storage.objects;
create policy "invitation-media: delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'invitation-media' and (storage.foldername(name))[1] = auth.uid()::text);
