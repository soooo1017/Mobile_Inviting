import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useProjects } from './ProjectsContext';
import { deletePostsRemote, fetchPosts, fetchRsvps, fetchVisitStats } from '../sync/guestApi';

// 하객이 공유한 초대장에 남긴 것 — 서버(Supabase)에서 읽어요(docs/SERVER_STORAGE.md §13-5).
// 화면을 열 때 · 다시 돌아올 때 · 아래로 당길 때 새로 읽고, 읽는 동안에는 지난번에 읽은 값을 먼저 보여줘요.

export type RsvpResponse = {
  id: string;
  name: string;
  attending: boolean;
  /** 0 = 신랑측 / first host's side, 1 = the other. */
  side?: 0 | 1;
  companions?: number;
  meal?: boolean;
  phone?: string;
  message?: string;
  /** ISO time the response was (last) sent. */
  at: string;
};

export type GuestbookPost = { id: string; name: string; side?: 0 | 1; text: string; at: string };

export type VisitStats = {
  /** 방문한 사람 — distinct visitors. */
  people: number;
  peopleToday: number;
  /** 열어본 횟수 — every open of the link. */
  opens: number;
  /** 방문한 사람 per day, oldest first, the last entry is today. */
  daily: number[];
};

const EMPTY_VISITS: VisitStats = { people: 0, peopleToday: 0, opens: 0, daily: Array(14).fill(0) };

type Snapshot = { responses: RsvpResponse[]; posts: GuestbookPost[]; visits: VisitStats };
/** 초대장마다 마지막으로 읽은 값 — 화면을 다시 열어도 빈 화면이 번쩍이지 않게. 로그아웃하면 비워요. */
const cache = new Map<string, Snapshot>();
export function clearGuestCache() {
  cache.clear();
}

/** 'loading' = 처음 읽는 중, 'ready' = 읽음, 'offline' / 'error' = 못 읽음(지난번 값을 그대로 보여줘요). */
export type GuestStatus = 'loading' | 'ready' | 'offline' | 'error';

export function useGuestData(projectId: string) {
  const { setCounts } = useProjects();
  const cached = cache.get(projectId);
  const [snap, setSnap] = useState<Snapshot>(cached ?? { responses: [], posts: [], visits: EMPTY_VISITS });
  const [status, setStatus] = useState<GuestStatus>(cached ? 'ready' : 'loading');
  const [refreshing, setRefreshing] = useState(false);
  const alive = useRef(true);
  const seq = useRef(0);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const mine = ++seq.current;
    const [r, p, v] = await Promise.all([fetchRsvps(projectId), fetchPosts(projectId), fetchVisitStats(projectId)]);
    if (!alive.current || mine !== seq.current) return;
    const failed = [r, p, v].find((x) => !x.ok);
    if (failed && !failed.ok) {
      setStatus(failed.kind === 'offline' ? 'offline' : 'error');
      return;
    }
    const next: Snapshot = {
      responses: r.ok ? r.data : [],
      posts: p.ok ? p.data : [],
      visits: v.ok ? v.data : EMPTY_VISITS,
    };
    cache.set(projectId, next);
    setSnap(next);
    setStatus('ready');
    // 목록 · 새 소식 표시의 개수도 방금 읽은 값으로 맞춰요(이 화면에서 본 건 새 소식이 아니에요).
    setCounts({ [projectId]: { rsvp: next.responses.length, guestbook: next.posts.length } });
  }, [projectId, setCounts]);

  // 화면이 보일 때마다(처음 · 다른 화면에서 돌아올 때) 새로 읽어요.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  /** 아래로 당겨서 새로고침. */
  const pull = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    if (alive.current) setRefreshing(false);
  }, [refresh]);

  /** 방명록 글 지우기 — 서버에서 지우고 성공하면 목록에서도 바로 빼요. 돌려주는 값은 결과예요. */
  const deletePosts = useCallback(
    async (ids: string[]): Promise<'ok' | 'offline' | 'error'> => {
      const res = await deletePostsRemote(ids);
      const base = cache.get(projectId);
      if (res === 'ok' && base) {
        const next = { ...base, posts: base.posts.filter((x) => !ids.includes(x.id)) };
        cache.set(projectId, next);
        if (alive.current) setSnap(next);
        setCounts({ [projectId]: { rsvp: next.responses.length, guestbook: next.posts.length } });
      }
      return res;
    },
    [projectId, setCounts],
  );

  return { responses: snap.responses, posts: snap.posts, visits: snap.visits, status, refreshing, pull, deletePosts };
}

/** 참석 예정 — everyone coming, the guests themselves plus their companions. */
export function attendingHeadcount(responses: RsvpResponse[]) {
  const coming = responses.filter((r) => r.attending);
  const companions = coming.reduce((n, r) => n + (r.companions ?? 0), 0);
  return { total: coming.length + companions, guests: coming.length, companions };
}
