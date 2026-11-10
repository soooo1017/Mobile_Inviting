/**
 * 하객이 링크로 열었을 때 서버(Supabase)에서 초대장을 읽어 와요 — 로그인 없이 공개 함수 `get_public_invitation`만 불러요.
 * 없는 주소와 작성 중인 주소는 서버가 똑같이 "preparing"으로 돌려줘서, 이것저것 넣어 봐도 누가 쓰는 주소인지 알 수 없어요.
 */

export type PublicInvitation =
  | { state: 'preparing' }
  | { state: 'stopped' }
  | { state: 'ended' }
  | { state: 'error' }
  | { state: 'live'; id: string; title: string; event_type: string; event_at: string; content: unknown; thanks: unknown; updated_at: string };

const SLUG = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export async function getPublicInvitation(rawSlug: string): Promise<PublicInvitation> {
  const slug = rawSlug.toLowerCase();
  // 주소 모양이 아니면 서버에 묻지 않아요(없는 주소와 똑같이 취급).
  if (!SLUG.test(slug) || slug.length < 4 || slug.length > 40) return { state: 'preparing' };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // 서버 연결 값이 아직 안 들어 있으면 열 수 있는 초대장이 없는 것과 같아요.
  if (!url || !key) return { state: 'preparing' };

  try {
    // 주소는 `https://….supabase.co` 까지만 있으면 돼요 — 대시보드의 API URL(`…/rest/v1/`)을 그대로 붙여 넣어도 되게 뒤쪽을 걷어내요.
    const base = url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    // 예전 방식 anon 키(eyJ…)는 Authorization에도 같이 보내고, 새 방식 publishable 키(sb_publishable_…)는 apikey에만 보내요.
    const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' };
    if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
    const res = await fetch(`${base}/rest/v1/rpc/get_public_invitation`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_slug: slug }),
      cache: 'no-store',
    });
    if (!res.ok) return { state: 'error' };
    const data = (await res.json()) as { state?: string };
    switch (data?.state) {
      case 'live':
      case 'stopped':
      case 'ended':
      case 'preparing':
        return data as unknown as PublicInvitation;
      case 'missing': // 예전 서버 함수 — 작성 중과 똑같이 취급해요.
      default:
        return { state: 'preparing' };
    }
  } catch {
    return { state: 'error' };
  }
}
