import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../state/AuthContext';
import { useProjects } from '../state/ProjectsContext';
import { useInvitationsStore } from '../state/InvitationsContext';
import { regeneratedLink } from '../share/link';
import type { Project } from '../types/project';
import type { Invitation } from '../editor/types';
import { deleteRow, fetchRow, fetchRows, insertRow, updateRow } from './api';
import { planBootstrap, type MetaMap } from './plan';
import { fromRow, hashOf, toPayload, type ServerRow } from './serialize';

/**
 * 폰 ↔ 서버(Supabase) 동기화 — docs/SERVER_STORAGE.md §13.
 * 초대장은 만드는 순간부터 내 계정에 저장되고, 고칠 때마다(약 2초 뒤) 자동으로 서버에 반영돼요. 폰을 바꿔도 로그인하면 이어서 고칠 수 있어요.
 *  - 폰이 먼저예요: 화면은 폰에 저장된 것을 쓰고, 서버는 그 사본이에요(인터넷이 없어도 고칠 수 있고, 연결되면 올려요).
 *  - 내용이 바뀌었는지는 내용 지문(hash)으로 알아봐요. "마지막으로 서버와 맞춘 때의 수정 번호(rev)와 지문"은 폰에 기억해요(sync:v1:<계정>).
 *  - 아직 안 한 것: 편집 잠금(두 폰 동시 편집 막기), 사진 · 음악 파일 올리기(지금은 폰 안의 파일 주소가 그대로 들어가요).
 */

export type SyncState = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

type SyncContextValue = {
  /** 저장 상태 — 저장 중 · 저장됨 · 오프라인(연결되면 올려요) · 오류. */
  state: SyncState;
  /** 폰에 저장된 초대장을 불러왔는지 (서버와 맞추는 건 이어서 해요 — 인터넷이 없어도 쓸 수 있어요). */
  ready: boolean;
  /** 사용자에게 알려줄 일이 있으면 문구 (예: 다른 기기에서 고친 내용을 불러왔어요). 확인하면 clearNotice. */
  notice: string | null;
  clearNotice: () => void;
};

const SyncContext = createContext<SyncContextValue>({ state: 'idle', ready: false, notice: null, clearNotice: () => {} });

const PUSH_DELAY_MS = 2000;
const RETRY_MS = 20000;
const MAX_SLUG_RETRIES = 5;
const metaKey = (uid: string) => `sync:v1:${uid}`;
const projectsKey = (uid: string) => `projects:v1:${uid}`;
const DEVICE_KEY = 'device:v1';

async function deviceName(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(DEVICE_KEY);
    if (saved) return saved;
    const name = `${Platform.OS}-${Math.random().toString(36).slice(2, 6)}`;
    await AsyncStorage.setItem(DEVICE_KEY, name);
    return name;
  } catch {
    return Platform.OS;
  }
}

export function useSync() {
  return useContext(SyncContext);
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { auth } = useAuth();
  const userId = auth.user?.id;
  const { projects, hydrate, setLink } = useProjects();
  const store = useInvitationsStore();

  const [rawState, setState] = useState<SyncState>('idle');
  // 폰에 저장된 내용을 불러온 계정 — 지금 로그인한 계정과 같을 때만 ready예요(계정이 바뀌면 자동으로 false가 돼요).
  const [syncedUser, setSyncedUser] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);
  const ready = Boolean(userId) && syncedUser === userId;
  const state: SyncState = userId ? rawState : 'idle';

  // 가장 최근 값 (비동기 작업 안에서 옛 값을 보지 않게).
  const projectsRef = useRef<Project[]>(projects);
  const invsRef = useRef<Record<string, Invitation>>(store.invitations);
  const readyRef = useRef(false);
  const userRef = useRef<string | undefined>(undefined);
  const deviceRef = useRef('');
  const metaRef = useRef<MetaMap>({});
  const deletedRef = useRef<string[]>([]);
  const serverSynced = useRef(false);
  const draining = useRef(false);
  const runId = useRef(0);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slugTries = useRef<Record<string, number>>({});
  const serverSyncRef = useRef<((list: Project[], invs: Record<string, Invitation>, run: number) => Promise<void>) | null>(null);

  useEffect(() => {
    projectsRef.current = projects;
    invsRef.current = store.invitations;
    readyRef.current = ready;
    userRef.current = userId;
  });

  const persistMeta = useCallback(() => {
    const uid = userRef.current;
    if (!uid) return;
    AsyncStorage.setItem(metaKey(uid), JSON.stringify({ meta: metaRef.current, deleted: deletedRef.current })).catch(() => {});
  }, []);

  /** 충돌로 이 폰 내용을 버리게 될 때, 나중에 찾을 수 있게 따로 남겨요. */
  const saveRecovery = useCallback((project: Project, inv: Invitation | undefined) => {
    AsyncStorage.setItem(`recovery:v1:${project.id}:${Date.now()}`, JSON.stringify({ project, invitation: inv })).catch(() => {});
  }, []);

  const adoptRow = useCallback(
    (row: ServerRow, prev: Project | undefined) => {
      const { project, invitation } = fromRow(row, prev);
      store.adopt(invitation);
      metaRef.current[row.local_id] = { rev: row.rev, hash: hashOf(toPayload(project, invitation)) };
      return project;
    },
    [store],
  );

  const scheduleRetry = useCallback((fn: () => void) => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = setTimeout(fn, RETRY_MS);
  }, []);

  /** 지문이 달라진(고친) 초대장을 서버에 올려요. 한 번에 하나씩, 겹쳐 돌지 않아요. */
  const drain = useCallback(async () => {
    const uid = userRef.current;
    if (!uid || !readyRef.current || !serverSynced.current || draining.current) return;
    draining.current = true;
    try {
      for (let round = 0; round < 6; round += 1) {
        // 다른 곳에서 지워진 게 아니라 이 폰에서 지운 초대장 → 서버에서도 지워요.
        const present = new Set(projectsRef.current.map((p) => p.id));
        for (const id of Object.keys(metaRef.current)) {
          if (!present.has(id) && !deletedRef.current.includes(id)) deletedRef.current.push(id);
        }
        const pendingDelete = [...deletedRef.current];
        const dirty = projectsRef.current.filter((p) => {
          const inv = invsRef.current[p.id];
          return inv && hashOf(toPayload(p, inv)) !== metaRef.current[p.id]?.hash;
        });
        if (!pendingDelete.length && !dirty.length) {
          setState('saved');
          return;
        }
        setState('saving');

        for (const id of pendingDelete) {
          const res = await deleteRow(uid, id);
          if (res !== 'ok') {
            setState(res === 'offline' ? 'offline' : 'error');
            scheduleRetry(() => void drain());
            return;
          }
          deletedRef.current = deletedRef.current.filter((x) => x !== id);
          delete metaRef.current[id];
          store.drop(id);
          persistMeta();
        }

        for (const p of dirty) {
          let project = projectsRef.current.find((x) => x.id === p.id);
          const inv = invsRef.current[p.id];
          if (!project || !inv) continue;
          let payload = toPayload(project, inv);
          if (hashOf(payload) === metaRef.current[p.id]?.hash) continue;
          const base = metaRef.current[p.id];
          const res = base ? await updateRow(uid, payload, base.rev, deviceRef.current) : await insertRow(uid, payload, deviceRef.current);

          if (res.ok) {
            metaRef.current[p.id] = { rev: res.rev, hash: hashOf(payload) };
            persistMeta();
            continue;
          }
          if (res.kind === 'offline') {
            setState('offline');
            scheduleRetry(() => void drain());
            return;
          }
          if (res.kind === 'slug') {
            // 주소가 겹쳤어요 — 아직 공유 전(작성 중)이라면 랜덤 글자를 다시 뽑아 다시 올려요.
            slugTries.current[p.id] = (slugTries.current[p.id] ?? 0) + 1;
            const next = regeneratedLink(project);
            if (!next || slugTries.current[p.id] > MAX_SLUG_RETRIES) {
              setState('error');
              scheduleRetry(() => void drain());
              return;
            }
            project = { ...project, link: next };
            setLink(p.id, next);
            payload = toPayload(project, inv);
            const retry = base ? await updateRow(uid, payload, base.rev, deviceRef.current) : await insertRow(uid, payload, deviceRef.current);
            if (retry.ok) {
              metaRef.current[p.id] = { rev: retry.rev, hash: hashOf(payload) };
              persistMeta();
              continue;
            }
            // 다음 바퀴에 다시 시도해요.
            continue;
          }
          if (res.kind === 'exists') {
            // 서버에 같은 초대장이 이미 있어요(올리다 끊긴 뒤 다시 시도 등) — 서버의 수정 번호를 알아 둬서 다음 바퀴에 고쳐 올려요.
            const found = await fetchRow(p.id);
            if (found.ok && found.row) metaRef.current[p.id] = { rev: found.row.rev, hash: '' };
            else {
              setState(found.ok ? 'error' : found.kind === 'offline' ? 'offline' : 'error');
              scheduleRetry(() => void drain());
              return;
            }
            continue;
          }
          if (res.kind === 'stale') {
            // 다른 기기가 먼저 고쳤어요.
            const found = await fetchRow(p.id);
            if (!found.ok) {
              setState(found.kind === 'offline' ? 'offline' : 'error');
              scheduleRetry(() => void drain());
              return;
            }
            if (!found.row) {
              // 서버에서 없어졌어요 — 내 작업을 잃지 않게 새로 올려요.
              delete metaRef.current[p.id];
            } else {
              saveRecovery(project, inv);
              const adopted = adoptRow(found.row, project);
              hydrate(projectsRef.current.map((x) => (x.id === p.id ? adopted : x)));
              setNotice('다른 기기에서 고친 내용이 있어서 최신 내용으로 불러왔어요.');
            }
            persistMeta();
            continue;
          }
          setState('error');
          scheduleRetry(() => void drain());
          return;
        }
      }
    } finally {
      draining.current = false;
    }
  }, [adoptRow, hydrate, persistMeta, saveRecovery, scheduleRetry, setLink, store]);

  /** 서버에 있는 내 초대장과 이 폰의 것을 맞춰요 (로그인 · 앱을 켰을 때). */
  const serverSync = useCallback(
    async (list: Project[], invs: Record<string, Invitation>, run: number) => {
      const uid = userRef.current;
      if (!uid) return;
      const res = await fetchRows();
      if (run !== runId.current) return;
      if (!res.ok) {
        setState(res.kind === 'offline' ? 'offline' : 'error');
        serverSynced.current = false;
        scheduleRetry(() => {
          if (run === runId.current) void serverSyncRef.current?.(projectsRef.current, invsRef.current, run);
        });
        return;
      }
      const byId = new Map(res.rows.map((r) => [r.local_id, r]));
      const local = list.map((p) => ({ id: p.id, hash: hashOf(toPayload(p, invs[p.id] ?? { projectId: p.id, font: 'pretendard', pages: { invite: [], popup: [], thanks: [] } })) }));
      const plan = planBootstrap(local, metaRef.current, res.rows, deletedRef.current);

      let next = [...list];
      for (const id of [...plan.adopt, ...plan.conflict]) {
        const row = byId.get(id);
        if (!row) continue;
        const prev = next.find((p) => p.id === id);
        if (plan.conflict.includes(id) && prev) {
          saveRecovery(prev, invs[id]);
          setNotice('다른 기기에서 고친 내용이 있어서 최신 내용으로 불러왔어요.');
        }
        const project = adoptRow(row, prev);
        next = prev ? next.map((p) => (p.id === id ? project : p)) : [project, ...next];
      }
      for (const id of plan.dropLocal) {
        next = next.filter((p) => p.id !== id);
        store.drop(id);
        delete metaRef.current[id];
      }
      for (const id of plan.inSync) {
        const row = byId.get(id);
        if (row) metaRef.current[id] = { rev: row.rev, hash: metaRef.current[id]?.hash ?? '' };
      }
      // 서버에서 지워야 하는 것(이 폰에서 지웠는데 서버엔 남은 것)은 drain이 처리해요.
      hydrate(next);
      persistMeta();
      serverSynced.current = true;
      projectsRef.current = next;
      void drain();
    },
    [adoptRow, drain, hydrate, persistMeta, saveRecovery, scheduleRetry, store],
  );
  useEffect(() => {
    serverSyncRef.current = serverSync;
  }, [serverSync]);

  // 로그인한 계정이 바뀌면(로그인 · 로그아웃 · 다른 계정) 처음부터 맞춰요.
  useEffect(() => {
    runId.current += 1;
    const run = runId.current;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    if (retryTimer.current) clearTimeout(retryTimer.current);
    serverSynced.current = false;
    metaRef.current = {};
    deletedRef.current = [];
    slugTries.current = {};
    readyRef.current = false;
    if (!userId) {
      hydrate([]);
      store.reset();
      return;
    }
    (async () => {
      deviceRef.current = await deviceName();
      setState('saving');
      const [metaRaw, projRaw] = await Promise.all([AsyncStorage.getItem(metaKey(userId)).catch(() => null), AsyncStorage.getItem(projectsKey(userId)).catch(() => null)]);
      if (run !== runId.current) return;
      try {
        const saved = metaRaw ? (JSON.parse(metaRaw) as { meta?: MetaMap; deleted?: string[] }) : {};
        metaRef.current = saved.meta ?? {};
        deletedRef.current = saved.deleted ?? [];
      } catch {
        metaRef.current = {};
      }
      let list: Project[] = [];
      try {
        list = projRaw ? (JSON.parse(projRaw) as Project[]) : [];
      } catch {
        list = [];
      }
      const invs = await store.loadAll(list.map((p) => p.id));
      if (run !== runId.current) return;
      hydrate(list);
      // 폰에 저장된 것을 불러왔으니 화면에서 쓸 수 있어요(인터넷이 없어도). 서버와 맞추는 건 이어서 해요.
      readyRef.current = true;
      setSyncedUser(userId);
      await serverSync(list, invs, run);
    })();
    // 계정이 바뀔 때만 다시 시작해요(함수들은 안정적이에요).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // 폰에 목록 저장 + 고쳐졌으면 잠시 뒤 서버에 올려요.
  useEffect(() => {
    if (!ready || !userId) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(projectsKey(userId), JSON.stringify(projects)).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [projects, ready, userId]);

  useEffect(() => {
    if (!ready || !userId || !serverSynced.current) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => void drain(), PUSH_DELAY_MS);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [projects, store.invitations, ready, userId, drain]);

  // 앱이 백그라운드로 가면 바로 올리고, 다시 돌아오면 다시 맞춰요.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (!userRef.current) return;
      if (next === 'background' || next === 'inactive') void drain();
      else if (next === 'active') {
        if (!serverSynced.current) void serverSyncRef.current?.(projectsRef.current, invsRef.current, runId.current);
        else void drain();
      }
    });
    return () => sub.remove();
  }, [drain]);

  const value = useMemo<SyncContextValue>(() => ({ state, ready, notice, clearNotice: () => setNotice(null) }), [state, ready, notice]);
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
