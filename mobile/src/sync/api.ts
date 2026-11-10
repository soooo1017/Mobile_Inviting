import { supabase } from '../lib/supabase';
import type { ServerRow, UpsertPayload } from './serialize';

/** 서버(Supabase `invitations`)와 주고받는 일. 결과는 앱이 다루기 쉬운 몇 가지 경우로만 나눠서 돌려줘요. */

export type PushResult =
  | { ok: true; rev: number; id: string }
  | { ok: false; kind: 'slug' | 'exists' | 'stale' | 'offline' | 'other'; message?: string };

type PgError = { code?: string; message?: string } | null;

/** 인터넷이 안 될 때는 서버가 답한 게 아니라서 오류 코드가 없어요. */
const isOffline = (e: PgError) => Boolean(e) && !e?.code && /network|fetch|timeout|failed to|offline/i.test(e?.message ?? '');

function pushError(e: NonNullable<PgError>): PushResult {
  if (isOffline(e)) return { ok: false, kind: 'offline', message: e.message };
  if (e.code === '23505') {
    const msg = e.message ?? '';
    if (msg.includes('invitations_slug_idx')) return { ok: false, kind: 'slug', message: msg };
    return { ok: false, kind: 'exists', message: msg };
  }
  return { ok: false, kind: 'other', message: e.message };
}

export async function fetchRows(): Promise<{ ok: true; rows: ServerRow[] } | { ok: false; kind: 'offline' | 'other' }> {
  try {
    const { data, error } = await supabase.from('invitations').select('*');
    if (error) return { ok: false, kind: isOffline(error) ? 'offline' : 'other' };
    return { ok: true, rows: (data ?? []) as ServerRow[] };
  } catch {
    return { ok: false, kind: 'offline' };
  }
}

export async function fetchRow(localId: string): Promise<{ ok: true; row: ServerRow | null } | { ok: false; kind: 'offline' | 'other' }> {
  try {
    const { data, error } = await supabase.from('invitations').select('*').eq('local_id', localId).maybeSingle();
    if (error) return { ok: false, kind: isOffline(error) ? 'offline' : 'other' };
    return { ok: true, row: (data as ServerRow | null) ?? null };
  } catch {
    return { ok: false, kind: 'offline' };
  }
}

/** 새 초대장을 서버에 만들어요. 주소(slug)가 겹치면 kind: 'slug', 같은 초대장이 이미 있으면 'exists'. */
export async function insertRow(ownerId: string, payload: UpsertPayload, device: string): Promise<PushResult> {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .insert({ ...payload, owner_id: ownerId, last_device: device })
      .select('id, rev')
      .single();
    if (error) return pushError(error);
    return { ok: true, id: data.id as string, rev: data.rev as number };
  } catch {
    return { ok: false, kind: 'offline' };
  }
}

/** 고친 내용을 올려요. "내가 마지막으로 본 수정 번호"일 때만 저장돼요 — 다른 기기가 먼저 고쳤으면 0줄이라 'stale'. */
export async function updateRow(ownerId: string, payload: UpsertPayload, baseRev: number, device: string): Promise<PushResult> {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .update({ ...payload, last_device: device })
      .eq('owner_id', ownerId)
      .eq('local_id', payload.local_id)
      .eq('rev', baseRev)
      .select('id, rev');
    if (error) return pushError(error);
    if (!data || data.length === 0) return { ok: false, kind: 'stale' };
    return { ok: true, id: data[0].id as string, rev: data[0].rev as number };
  } catch {
    return { ok: false, kind: 'offline' };
  }
}

export type ClaimResponse = { ok: boolean; device?: string; until?: string; took_over_from?: string | null };

/**
 * 편집권을 잡아요(편집 잠금 — 한 초대장은 한 번에 한 기기에서만 고쳐요). 같은 기기가 다시 부르면 유지(heartbeat),
 * 다른 기기가 편집 중이면 ok: false + 그 기기 이름, takeover = true면 넘겨받아요. 서버는 2분 동안 소식이 없으면 저절로 풀어요.
 */
export async function claimEditRpc(
  serverId: string,
  device: string,
  takeover: boolean,
): Promise<{ ok: true; data: ClaimResponse } | { ok: false; kind: 'offline' | 'other' }> {
  try {
    const { data, error } = await supabase.rpc('claim_edit', { p_invitation: serverId, p_device: device, p_takeover: takeover });
    if (error) return { ok: false, kind: isOffline(error) ? 'offline' : 'other' };
    return { ok: true, data: data as ClaimResponse };
  } catch {
    return { ok: false, kind: 'offline' };
  }
}

export async function releaseEditRpc(serverId: string, device: string): Promise<void> {
  try {
    await supabase.rpc('release_edit', { p_invitation: serverId, p_device: device });
  } catch {
    // 못 풀어도 2분 뒤에 저절로 풀려요.
  }
}

export async function deleteRow(ownerId: string, localId: string): Promise<'ok' | 'offline' | 'error'> {
  try {
    const { error } = await supabase.from('invitations').delete().eq('owner_id', ownerId).eq('local_id', localId);
    if (!error) return 'ok';
    return isOffline(error) ? 'offline' : 'error';
  } catch {
    return 'offline';
  }
}
