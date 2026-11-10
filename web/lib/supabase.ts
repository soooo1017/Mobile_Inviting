/**
 * 하객 페이지가 서버(Supabase)의 공개 함수(RPC)를 부르는 곳 — 서버 렌더링과 브라우저 둘 다 같은 코드를 써요.
 * 하객은 로그인 없이 anon(publishable) 키만 쓰고, 표를 직접 읽거나 쓰지 않고 함수로만 해요(보호는 서버 쪽이 해요).
 */

export type RpcResult<T> = { ok: true; data: T } | { ok: false; code: string; message: string };

/** `https://….supabase.co` — 대시보드의 API URL(`…/rest/v1/`)을 그대로 붙여 넣어도 되게 뒤쪽을 걷어내요. */
function config(): { base: string; headers: Record<string, string> } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const base = url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  // 예전 방식 anon 키(eyJ…)는 Authorization에도 같이 보내고, 새 방식 publishable 키(sb_publishable_…)는 apikey에만 보내요.
  const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' };
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
  return { base, headers };
}

export async function rpc<T>(name: string, args: Record<string, unknown>): Promise<RpcResult<T>> {
  const cfg = config();
  if (!cfg) return { ok: false, code: 'not_configured', message: '서버 연결 값이 없어요' };
  try {
    const res = await fetch(`${cfg.base}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: cfg.headers,
      body: JSON.stringify(args),
      cache: 'no-store',
    });
    const text = await res.text();
    const body = text ? (JSON.parse(text) as unknown) : null;
    if (!res.ok) {
      const err = (body ?? {}) as { code?: string; message?: string };
      return { ok: false, code: err.code ?? String(res.status), message: err.message ?? '' };
    }
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, code: 'network', message: '' };
  }
}
