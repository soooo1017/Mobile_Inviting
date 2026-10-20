import { useCallback, useState } from 'react';

// What guests leave on a shared invitation. 서버 연결은 보류(docs/SERVER_STORAGE.md) —
// until then every invitation has no responses, guestbook posts or visits, and the
// management screens show those real zeros rather than examples.

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

export function useGuestData(projectId: string) {
  // Keyed by project so a future fetch can slot in here without the screens changing.
  void projectId;
  const [responses] = useState<RsvpResponse[]>([]);
  const [posts, setPosts] = useState<GuestbookPost[]>([]);
  const deletePosts = useCallback((ids: string[]) => setPosts((prev) => prev.filter((p) => !ids.includes(p.id))), []);
  return { responses, posts, visits: EMPTY_VISITS, deletePosts };
}

/** 참석 예정 — everyone coming, the guests themselves plus their companions. */
export function attendingHeadcount(responses: RsvpResponse[]) {
  const coming = responses.filter((r) => r.attending);
  const companions = coming.reduce((n, r) => n + (r.companions ?? 0), 0);
  return { total: coming.length + companions, guests: coming.length, companions };
}
