import { supabase } from '../lib/supabase';
import type { GuestbookPost, RsvpResponse, VisitStats } from '../state/guestData';

/**
 * 하객이 남긴 참석 응답 · 방명록 · 방문 기록을 읽어요 (supabase/schema.sql 9번).
 * 표는 "내 초대장"만 읽을 수 있게 서버가 막고 있어서(RLS), 로그인한 내 계정으로 부르면 내 것만 와요.
 * 초대장은 폰 안의 번호(local_id)로 찾아요 — 같은 번호로 서버에 올라가 있어요.
 */

export type FetchKind = 'offline' | 'other';
export type Fetched<T> = { ok: true; data: T } | { ok: false; kind: FetchKind };

type PgError = { code?: string; message?: string } | null;
const isOffline = (e: PgError) => Boolean(e) && !e?.code && /network|fetch|timeout|failed to|offline/i.test(e?.message ?? '');
const fail = (e: PgError): { ok: false; kind: FetchKind } => ({ ok: false, kind: isOffline(e) ? 'offline' : 'other' });

type RsvpRow = {
  id: string;
  name: string;
  attending: boolean;
  side: number | null;
  companions: number | null;
  meal: boolean | null;
  phone: string | null;
  message: string | null;
  updated_at: string;
};

export function rsvpFromRow(r: RsvpRow): RsvpResponse {
  return {
    id: r.id,
    name: r.name,
    attending: r.attending,
    side: r.side === 0 || r.side === 1 ? r.side : undefined,
    companions: r.companions ?? 0,
    meal: r.meal ?? undefined,
    phone: r.phone ?? undefined,
    message: r.message ?? undefined,
    // 같은 사람이 다시 보내면 덮어쓰기 때문에 "마지막으로 보낸 시각"을 응답 시각으로 써요.
    at: r.updated_at,
  };
}

type PostRow = { id: string; name: string; side: number | null; body: string; created_at: string };

export function postFromRow(r: PostRow): GuestbookPost {
  return { id: r.id, name: r.name, side: r.side === 0 || r.side === 1 ? r.side : undefined, text: r.body, at: r.created_at };
}

export async function fetchRsvps(localId: string): Promise<Fetched<RsvpResponse[]>> {
  try {
    const { data, error } = await supabase
      .from('rsvp_responses')
      .select('id, name, attending, side, companions, meal, phone, message, updated_at, invitations!inner(local_id)')
      .eq('invitations.local_id', localId)
      .order('updated_at', { ascending: false })
      .limit(2000);
    if (error) return fail(error);
    return { ok: true, data: ((data ?? []) as unknown as RsvpRow[]).map(rsvpFromRow) };
  } catch {
    return { ok: false, kind: 'offline' };
  }
}

export async function fetchPosts(localId: string): Promise<Fetched<GuestbookPost[]>> {
  try {
    const { data, error } = await supabase
      .from('guestbook_posts')
      .select('id, name, side, body, created_at, invitations!inner(local_id)')
      .eq('invitations.local_id', localId)
      .order('created_at', { ascending: false })
      .limit(2000);
    if (error) return fail(error);
    return { ok: true, data: ((data ?? []) as unknown as PostRow[]).map(postFromRow) };
  } catch {
    return { ok: false, kind: 'offline' };
  }
}

export async function fetchVisitStats(localId: string, days = 14): Promise<Fetched<VisitStats>> {
  try {
    const { data, error } = await supabase.rpc('visit_stats', { p_local_id: localId, p_days: days });
    if (error) return fail(error);
    const v = (data ?? {}) as { people?: number; opens?: number; today?: number; daily?: number[] };
    const daily = Array.isArray(v.daily) && v.daily.length ? v.daily : Array(days).fill(0);
    return { ok: true, data: { people: v.people ?? 0, opens: v.opens ?? 0, peopleToday: v.today ?? 0, daily } };
  } catch {
    return { ok: false, kind: 'offline' };
  }
}

/** 방명록 글 지우기 — 내 초대장의 글만 지워져요(서버가 막아요). */
export async function deletePostsRemote(ids: string[]): Promise<'ok' | 'offline' | 'error'> {
  if (!ids.length) return 'ok';
  try {
    const { error } = await supabase.from('guestbook_posts').delete().in('id', ids);
    if (!error) return 'ok';
    return isOffline(error) ? 'offline' : 'error';
  } catch {
    return 'offline';
  }
}

/** 내 초대장마다 참석 응답 · 방명록 글 수 (목록 · 새 소식 표시용). 키 = 폰 안의 초대장 번호. */
export async function fetchGuestCounts(): Promise<Fetched<Record<string, { rsvp: number; guestbook: number }>>> {
  try {
    const { data, error } = await supabase.rpc('owner_guest_counts');
    if (error) return fail(error);
    const out: Record<string, { rsvp: number; guestbook: number }> = {};
    for (const r of (data ?? []) as { local_id: string; rsvp: number; guestbook: number }[]) out[r.local_id] = { rsvp: r.rsvp ?? 0, guestbook: r.guestbook ?? 0 };
    return { ok: true, data: out };
  } catch {
    return { ok: false, kind: 'offline' };
  }
}
