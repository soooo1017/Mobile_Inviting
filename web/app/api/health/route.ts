/**
 * 서버 연결이 잘 됐는지 확인하는 주소 — 열어보면 { configured, keyKind, reachable }만 나와요(키 · 주소 값은 절대 안 나와요).
 *  - configured: Vercel 환경변수 두 개가 들어 있는지
 *  - keyKind: 키 종류 (publishable = sb_publishable_… / jwt = eyJ… / other = 모양이 다름)
 *  - reachable: Supabase가 하객 함수 호출에 제대로 답하는지
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const keyKind = !key ? 'none' : key.startsWith('sb_publishable_') ? 'publishable' : key.startsWith('eyJ') ? 'jwt' : key.startsWith('sb_secret_') ? 'SECRET-DO-NOT-USE' : 'other';
  let reachable = false;
  if (url && key) {
    try {
      const base = url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
      const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' };
      if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
      const res = await fetch(`${base}/rest/v1/rpc/get_public_invitation`, { method: 'POST', headers, body: JSON.stringify({ p_slug: 'healthcheck' }), cache: 'no-store' });
      const data = res.ok ? ((await res.json()) as { state?: string }) : null;
      reachable = Boolean(data?.state);
    } catch {
      reachable = false;
    }
  }
  return Response.json({ configured: Boolean(url && key), keyKind, reachable });
}
