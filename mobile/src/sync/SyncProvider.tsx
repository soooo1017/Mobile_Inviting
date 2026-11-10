import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../state/AuthContext';
import { useProjects } from '../state/ProjectsContext';
import { useInvitationsStore } from '../state/InvitationsContext';
import { regeneratedLink } from '../share/link';
import type { Project } from '../types/project';
import type { Invitation } from '../editor/types';
import { claimEditRpc, deleteRow, fetchRow, fetchRows, insertRow, releaseEditRpc, updateRow } from './api';
import { fetchGuestCounts } from './guestApi';
import { clearGuestCache } from '../state/guestData';
import { pathFromUrl, removeFiles, removeProjectFolder, uploadMusic, uploadPhoto } from './media';
import { allPhotos, applyUploads, hasPendingMedia, pendingMedia, referencedUrls, type PendingMedia, type UploadedPhoto } from './mediaRefs';
import { planBootstrap, type MetaMap } from './plan';
import { fromRow, hashOf, toPayload, type ServerRow } from './serialize';

/**
 * 폰 ↔ 서버(Supabase) 동기화 — docs/SERVER_STORAGE.md §13.
 * 초대장은 만드는 순간부터 내 계정에 저장되고, 고칠 때마다(약 2초 뒤) 자동으로 서버에 반영돼요. 폰을 바꿔도 로그인하면 이어서 고칠 수 있어요.
 *  - 폰이 먼저예요: 화면은 폰에 저장된 것을 쓰고, 서버는 그 사본이에요(인터넷이 없어도 고칠 수 있고, 연결되면 올려요).
 *  - 내용이 바뀌었는지는 내용 지문(hash)으로 알아봐요. "마지막으로 서버와 맞춘 때의 수정 번호(rev)와 지문"은 폰에 기억해요(sync:v1:<계정>).
 *  - 사진 · 내 음악: 폰 안의 파일은 올리기 전에 서버(Storage)에 올려서(사진은 긴 변 1600px로 줄여서) 인터넷 주소로 바꾼 뒤 내용을 저장해요.
 *    바꾸거나 지워서 안 쓰게 된 파일은 저장에 성공하고 1분 뒤에 서버에서 지워요(되돌리기를 누를 시간을 줘요). 초대장을 지우면 폴더째 지워요.
 *    사진을 고르는 중(`hold`)에는 올리지 않아서, 고르다 만 사진은 서버에 저장되지 않아요.
 *  - 편집 잠금: 한 초대장은 한 번에 한 기기에서만 고쳐요(`claimEdit` · `useEditLock`). 다른 기기가 편집 중이면 에디터를 열 때 물어보고,
 *    넘겨받으면 그 기기는 "보기만 가능"이 돼요. 넘겨받은 쪽은 이전 기기가 마지막 수정을 올릴 시간을 주고 서버의 최신 내용을 가져와요(`pullProject`).
 */

export type SyncState = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

type SyncContextValue = {
  /** 저장 상태 — 저장 중 · 저장됨 · 오프라인(연결되면 올려요) · 오류. */
  state: SyncState;
  /** 폰에 저장된 초대장을 불러왔는지 (서버와 맞추는 건 이어서 해요 — 인터넷이 없어도 쓸 수 있어요). */
  ready: boolean;
  /** (편집 잠금) 에디터를 열 때 편집권을 잡아요. takeover = true면 다른 기기가 편집 중이어도 넘겨받아요. */
  claimEdit: (projectId: string, takeover: boolean) => Promise<ClaimResult>;
  /** (편집 잠금) 에디터를 나가면 편집권을 풀어요(안 풀어도 2분 뒤에 저절로 풀려요). */
  releaseEdit: (projectId: string) => void;
  /** 서버의 최신 내용을 가져와요(폰 내용이 그대로면 조용히 바꾸고, 둘 다 바뀌었으면 이 폰 내용은 복구본으로 남겨요). */
  pullProject: (projectId: string) => Promise<void>;
  /** 쌓인 수정을 지금 바로 서버에 올려요. */
  flush: () => void;
  /** 사진을 고르는 동안 서버 업로드를 잠시 멈춰요(고르다 만 사진이 올라가지 않게). 돌려받은 함수를 부르면 다시 시작해요. */
  hold: () => () => void;
  /** 사용자에게 알려줄 일이 있으면 문구 (예: 다른 기기에서 고친 내용을 불러왔어요). 확인하면 clearNotice. */
  notice: string | null;
  clearNotice: () => void;
};

export type ClaimResult =
  | { kind: 'ok' }
  /** 다른 기기가 편집 중이에요(기기 이름 예: iPhone). */
  | { kind: 'busy'; device: string }
  /** 아직 서버에 올라가기 전이라 잠금을 못 잡아요(새 초대장 — 편집은 그대로 가능). */
  | { kind: 'unsynced' }
  | { kind: 'offline' }
  | { kind: 'error' };

const SyncContext = createContext<SyncContextValue>({
  state: 'idle',
  ready: false,
  notice: null,
  clearNotice: () => {},
  hold: () => () => {},
  claimEdit: async () => ({ kind: 'unsynced' }),
  releaseEdit: () => {},
  pullProject: async () => {},
  flush: () => {},
});

const deviceLabel = (name: string) => (name.startsWith('ios') ? 'iPhone' : name.startsWith('android') ? 'Android 폰' : '다른 기기');

const PUSH_DELAY_MS = 2000;
/** 안 쓰게 된 파일을 서버에서 지우기 전에 기다리는 시간 — 지우기 [되돌리기]를 눌러도 사진이 남아 있게. */
const CLEANUP_DELAY_MS = 60000;
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
  const { projects, hydrate, setLink, setCounts } = useProjects();
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
  /** 초대장마다 서버 보관함에 올려 둔 파일 경로 (안 쓰게 되면 지워요). */
  const filesRef = useRef<Record<string, string[]>>({});
  /** 마지막으로 서버에 저장한 내용이 쓰는 파일 주소들 (정리할 때 지우면 안 되는 것). */
  const pushedUrlsRef = useRef<Record<string, string[]>>({});
  const holds = useRef(0);
  const cleanupTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
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
    AsyncStorage.setItem(metaKey(uid), JSON.stringify({ meta: metaRef.current, deleted: deletedRef.current, files: filesRef.current })).catch(() => {});
  }, []);

  /** 충돌로 이 폰 내용을 버리게 될 때, 나중에 찾을 수 있게 따로 남겨요. */
  const saveRecovery = useCallback((project: Project, inv: Invitation | undefined) => {
    AsyncStorage.setItem(`recovery:v1:${project.id}:${Date.now()}`, JSON.stringify({ project, invitation: inv })).catch(() => {});
  }, []);

  const adoptRow = useCallback(
    (row: ServerRow, prev: Project | undefined) => {
      const { project, invitation } = fromRow(row, prev);
      store.adopt(invitation);
      metaRef.current[row.local_id] = { rev: row.rev, hash: hashOf(toPayload(project, invitation)), serverId: row.id };
      // 서버 내용이 쓰는 파일은 이 폰에서도 나중에 바꾸거나 지울 때 정리할 수 있게 기억해요.
      const paths = referencedUrls(invitation).map(pathFromUrl).filter((x): x is string => Boolean(x));
      filesRef.current[row.local_id] = [...new Set([...(filesRef.current[row.local_id] ?? []), ...paths])];
      pushedUrlsRef.current[row.local_id] = referencedUrls(invitation);
      return project;
    },
    [store],
  );

  const scheduleRetry = useCallback((fn: () => void) => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = setTimeout(fn, RETRY_MS);
  }, []);

  const drainRef = useRef<(() => Promise<void>) | null>(null);
  const cleanupRef = useRef<((projectId: string) => Promise<void>) | null>(null);

  /** 올려 둔 파일 중 안 쓰게 된 것을 서버에서 지워요. 되돌리기 시간을 주려고 저장 1분 뒤에 해요. */
  const cleanupFiles = useCallback(
    async (projectId: string) => {
      const files = filesRef.current[projectId];
      if (!files?.length) return;
      if (draining.current || holds.current > 0) {
        // 올리는 중이거나 사진을 고르는 중이면 새로 올린 파일을 잘못 지울 수 있어서 조금 뒤에 다시 봐요.
        cleanupTimers.current[projectId] = setTimeout(() => void cleanupRef.current?.(projectId), CLEANUP_DELAY_MS);
        return;
      }
      const inv = invsRef.current[projectId];
      const keep = new Set<string>();
      for (const url of [...(pushedUrlsRef.current[projectId] ?? []), ...(inv ? referencedUrls(inv) : [])]) {
        const path = pathFromUrl(url);
        if (path) keep.add(path);
      }
      const stale = files.filter((f) => !keep.has(f));
      if (!stale.length) return;
      if (await removeFiles(stale)) {
        filesRef.current[projectId] = files.filter((f) => keep.has(f));
        persistMeta();
      }
    },
    [persistMeta],
  );

  useEffect(() => {
    cleanupRef.current = cleanupFiles;
  }, [cleanupFiles]);

  const scheduleCleanup = useCallback((projectId: string) => {
    if (cleanupTimers.current[projectId]) clearTimeout(cleanupTimers.current[projectId]);
    cleanupTimers.current[projectId] = setTimeout(() => void cleanupRef.current?.(projectId), CLEANUP_DELAY_MS);
  }, []);

  const addFile = useCallback((projectId: string, path: string) => {
    const list = filesRef.current[projectId] ?? [];
    if (!list.includes(path)) filesRef.current[projectId] = [...list, path];
  }, []);

  /** 아직 서버에 안 올라간 사진 · 음악을 올려요. 올라간 것은 바로 초대장 내용에 반영해서(중간에 끊겨도 다시 올리지 않게) 폰에도 저장돼요. */
  const uploadPending = useCallback(
    async (uid: string, projectId: string, inv: Invitation, pending: PendingMedia) => {
      const photos: Record<string, UploadedPhoto> = {};
      const sources = new Map(allPhotos(inv).map((ph) => [ph.uri, ph]));
      for (const uri of pending.photoUris) {
        const src = sources.get(uri);
        if (!src) continue;
        const res = await uploadPhoto(uid, projectId, { uri, width: src.width, height: src.height });
        if (!res.ok) return { ok: false as const, kind: res.kind };
        const done: UploadedPhoto = { url: res.url, width: res.width ?? src.width, height: res.height ?? src.height };
        photos[uri] = done;
        addFile(projectId, res.path);
        store.mutate(projectId, (cur) => applyUploads(cur, { [uri]: done }));
      }
      let music: { from: string; url: string } | undefined;
      if (pending.music && inv.bgm?.file) {
        const res = await uploadMusic(uid, projectId, { uri: pending.music, name: inv.bgm.file.name });
        if (!res.ok) return { ok: false as const, kind: res.kind };
        music = { from: pending.music, url: res.url };
        addFile(projectId, res.path);
        const m = music;
        store.mutate(projectId, (cur) => applyUploads(cur, {}, m));
      }
      persistMeta();
      return { ok: true as const, inv: applyUploads(inv, photos, music) };
    },
    [addFile, persistMeta, store],
  );

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
        let heldWaiting = false;
        const dirty = projectsRef.current.filter((p) => {
          const inv = invsRef.current[p.id];
          if (!inv) return false;
          const pending = hasPendingMedia(inv);
          // 사진을 고르는 중이면 그 초대장은 고르기가 끝날 때까지 올리지 않아요(고르다 만 사진이 서버에 남지 않게).
          if (pending && holds.current > 0) {
            heldWaiting = true;
            return false;
          }
          return pending || hashOf(toPayload(p, inv)) !== metaRef.current[p.id]?.hash;
        });
        if (!pendingDelete.length && !dirty.length) {
          setState(heldWaiting ? 'saving' : 'saved');
          return;
        }
        setState('saving');
        let uploadedThisRound = false;

        for (const id of pendingDelete) {
          const res = await deleteRow(uid, id);
          if (res !== 'ok') {
            setState(res === 'offline' ? 'offline' : 'error');
            scheduleRetry(() => void drain());
            return;
          }
          deletedRef.current = deletedRef.current.filter((x) => x !== id);
          delete metaRef.current[id];
          delete filesRef.current[id];
          delete pushedUrlsRef.current[id];
          store.drop(id);
          persistMeta();
          // 사진 · 음악 파일도 폴더째 지워요(놓친 파일까지). 못 지워도 초대장은 이미 지워졌으니 넘어가요.
          void removeProjectFolder(uid, id);
        }

        for (const p of dirty) {
          let project = projectsRef.current.find((x) => x.id === p.id);
          let inv = invsRef.current[p.id];
          if (!project || !inv) continue;
          const pending = pendingMedia(inv);
          if (pending.photoUris.length || pending.music) {
            if (holds.current > 0) continue;
            const up = await uploadPending(uid, p.id, inv, pending);
            if (!up.ok) {
              setState(up.kind === 'offline' ? 'offline' : 'error');
              scheduleRetry(() => void drain());
              return;
            }
            inv = up.inv;
            uploadedThisRound = true;
          }
          let payload = toPayload(project, inv);
          if (hashOf(payload) === metaRef.current[p.id]?.hash) continue;
          const base = metaRef.current[p.id];
          const res = base ? await updateRow(uid, payload, base.rev, deviceRef.current) : await insertRow(uid, payload, deviceRef.current);

          if (res.ok) {
            metaRef.current[p.id] = { rev: res.rev, hash: hashOf(payload), serverId: res.id };
            pushedUrlsRef.current[p.id] = referencedUrls(inv);
            persistMeta();
            scheduleCleanup(p.id);
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
              metaRef.current[p.id] = { rev: retry.rev, hash: hashOf(payload), serverId: retry.id };
              pushedUrlsRef.current[p.id] = referencedUrls(inv);
              persistMeta();
              scheduleCleanup(p.id);
              continue;
            }
            // 다음 바퀴에 다시 시도해요.
            continue;
          }
          if (res.kind === 'exists') {
            // 서버에 같은 초대장이 이미 있어요(올리다 끊긴 뒤 다시 시도 등) — 서버의 수정 번호를 알아 둬서 다음 바퀴에 고쳐 올려요.
            const found = await fetchRow(p.id);
            if (found.ok && found.row) metaRef.current[p.id] = { rev: found.row.rev, hash: '', serverId: found.row.id };
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
        if (uploadedThisRound) {
          // 방금 올라간 주소가 화면 상태에 반영될 때까지 잠깐 기다렸다가 이어서 해요(같은 사진을 또 올리지 않게).
          if (pushTimer.current) clearTimeout(pushTimer.current);
          pushTimer.current = setTimeout(() => void drainRef.current?.(), 1500);
          return;
        }
      }
    } finally {
      draining.current = false;
    }
  }, [adoptRow, hydrate, persistMeta, saveRecovery, scheduleCleanup, scheduleRetry, setLink, store, uploadPending]);
  useEffect(() => {
    drainRef.current = drain;
  }, [drain]);

  const hold = useCallback(() => {
    holds.current += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      holds.current = Math.max(0, holds.current - 1);
      if (holds.current === 0) {
        // 고르기가 끝났어요 — 최종으로 남은 사진을 곧 올려요.
        if (pushTimer.current) clearTimeout(pushTimer.current);
        pushTimer.current = setTimeout(() => void drainRef.current?.(), 500);
      }
    };
  }, []);

  /** 하객이 남긴 참석 응답 · 방명록 글 수를 목록 · 새 소식 표시에 반영해요 (맞춘 뒤 · 앱을 켤 때 · 켜 둔 동안 1분마다). */
  const countsBusy = useRef(false);
  const refreshCounts = useCallback(async () => {
    if (!userRef.current || !serverSynced.current || countsBusy.current) return;
    countsBusy.current = true;
    const uid = userRef.current;
    try {
      const res = await fetchGuestCounts();
      if (res.ok && userRef.current === uid) setCounts(res.data);
    } finally {
      countsBusy.current = false;
    }
  }, [setCounts]);
  const refreshCountsRef = useRef(refreshCounts);
  useEffect(() => {
    refreshCountsRef.current = refreshCounts;
  }, [refreshCounts]);

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
        if (row) metaRef.current[id] = { rev: row.rev, hash: metaRef.current[id]?.hash ?? '', serverId: row.id };
      }
      // 서버에서 지워야 하는 것(이 폰에서 지웠는데 서버엔 남은 것)은 drain이 처리해요.
      hydrate(next);
      persistMeta();
      serverSynced.current = true;
      projectsRef.current = next;
      void drain();
      void refreshCountsRef.current();
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
    filesRef.current = {};
    pushedUrlsRef.current = {};
    Object.values(cleanupTimers.current).forEach(clearTimeout);
    cleanupTimers.current = {};
    slugTries.current = {};
    readyRef.current = false;
    clearGuestCache();
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
        const saved = metaRaw ? (JSON.parse(metaRaw) as { meta?: MetaMap; deleted?: string[]; files?: Record<string, string[]> }) : {};
        metaRef.current = saved.meta ?? {};
        deletedRef.current = saved.deleted ?? [];
        filesRef.current = saved.files ?? {};
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
        else {
          void drain();
          void refreshCountsRef.current();
        }
      }
    });
    return () => sub.remove();
  }, [drain]);

  // 앱이 켜져 있는 동안 1분마다 새 응답 · 방명록이 있는지 살펴봐요(숫자 하나만 받아오는 가벼운 요청이에요).
  useEffect(() => {
    if (!ready || !userId) return;
    const t = setInterval(() => {
      if (AppState.currentState === 'active') void refreshCountsRef.current();
    }, 60000);
    return () => clearInterval(t);
  }, [ready, userId]);

  const claimEditImpl = useCallback(async (projectId: string, takeover: boolean): Promise<ClaimResult> => {
    const serverId = metaRef.current[projectId]?.serverId;
    if (!serverId || !serverSynced.current) return { kind: 'unsynced' };
    const res = await claimEditRpc(serverId, deviceRef.current, takeover);
    if (!res.ok) return { kind: res.kind === 'offline' ? 'offline' : 'error' };
    return res.data.ok ? { kind: 'ok' } : { kind: 'busy', device: deviceLabel(res.data.device ?? '') };
  }, []);

  const releaseEditImpl = useCallback((projectId: string) => {
    const serverId = metaRef.current[projectId]?.serverId;
    if (serverId) void releaseEditRpc(serverId, deviceRef.current);
  }, []);

  const pullProjectImpl = useCallback(
    async (projectId: string) => {
      const found = await fetchRow(projectId);
      if (!found.ok || !found.row) return;
      const project = projectsRef.current.find((p) => p.id === projectId);
      const inv = invsRef.current[projectId];
      const meta = metaRef.current[projectId];
      if (!project || !inv) return;
      if (meta && found.row.rev === meta.rev) return; // 서버도 그대로
      const unchanged = meta && hashOf(toPayload(project, inv)) === meta.hash;
      if (!unchanged) {
        saveRecovery(project, inv);
        setNotice('다른 기기에서 고친 내용이 있어서 최신 내용으로 불러왔어요.');
      }
      const adopted = adoptRow(found.row, project);
      persistMeta();
      hydrate(projectsRef.current.map((x) => (x.id === projectId ? adopted : x)));
    },
    [adoptRow, hydrate, persistMeta, saveRecovery],
  );

  // 화면 쪽은 항상 같은 함수를 받도록(주기적으로 불러도 다시 그려지지 않게) 최신 구현을 ref로 가리켜요.
  const lockImpl = useRef({ claimEdit: claimEditImpl, releaseEdit: releaseEditImpl, pullProject: pullProjectImpl });
  useEffect(() => {
    lockImpl.current = { claimEdit: claimEditImpl, releaseEdit: releaseEditImpl, pullProject: pullProjectImpl };
  }, [claimEditImpl, releaseEditImpl, pullProjectImpl]);
  const lockApi = useMemo(
    () => ({
      claimEdit: (projectId: string, takeover: boolean) => lockImpl.current.claimEdit(projectId, takeover),
      releaseEdit: (projectId: string) => lockImpl.current.releaseEdit(projectId),
      pullProject: (projectId: string) => lockImpl.current.pullProject(projectId),
      flush: () => void drainRef.current?.(),
    }),
    [],
  );

  const value = useMemo<SyncContextValue>(
    () => ({ state, ready, notice, clearNotice: () => setNotice(null), hold, ...lockApi }),
    [state, ready, notice, hold, lockApi],
  );
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
