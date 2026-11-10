/**
 * 하객이 링크로 열었을 때 서버(Supabase)에서 초대장을 읽어 와요 — 로그인 없이 공개 함수 `get_public_invitation`만 불러요.
 * 없는 주소와 작성 중인 주소는 서버가 똑같이 "preparing"으로 돌려줘서, 이것저것 넣어 봐도 누가 쓰는 주소인지 알 수 없어요.
 */
import { rpc } from './supabase';
import type { InvitationContent, PublicMeta, ThanksSettings } from './model';

export type LiveInvitation = {
  state: 'live';
  id: string;
  title: string;
  event_type: string;
  event_at: string;
  content: InvitationContent;
  thanks: ThanksSettings;
  /** 색 · 장소 · 주최자 이름. 서버 함수가 예전 버전이면 없을 수 있어요(기본 색으로 그려요). */
  public_meta?: PublicMeta;
  updated_at: string;
};

export type PublicInvitation = { state: 'preparing' } | { state: 'stopped' } | { state: 'ended' } | { state: 'error' } | LiveInvitation;

const SLUG = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export function isValidSlug(slug: string): boolean {
  return SLUG.test(slug) && slug.length >= 4 && slug.length <= 40;
}

export async function getPublicInvitation(rawSlug: string): Promise<PublicInvitation> {
  const slug = rawSlug.toLowerCase();
  // 주소 모양이 아니면 서버에 묻지 않아요(없는 주소와 똑같이 취급).
  if (!isValidSlug(slug)) return { state: 'preparing' };

  const res = await rpc<{ state?: string }>('get_public_invitation', { p_slug: slug });
  // 서버 연결 값이 아직 안 들어 있으면 열 수 있는 초대장이 없는 것과 같아요.
  if (!res.ok) return res.code === 'not_configured' ? { state: 'preparing' } : { state: 'error' };
  switch (res.data?.state) {
    case 'live':
    case 'stopped':
    case 'ended':
    case 'preparing':
      return res.data as PublicInvitation;
    case 'missing': // 예전 서버 함수 — 작성 중과 똑같이 취급해요.
    default:
      return { state: 'preparing' };
  }
}
