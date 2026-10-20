import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cloneBlock, type Bgm, type Block, type FontId, type Invitation, type PageKey, type ThanksPage } from '../editor/types';

// 저장 방식 (EDITOR_PLAN §10, 확정): mock first — every invitation is saved
// on the phone and auto-saved after each change. Server storage (Supabase)
// gets wired in later together with the guest-facing pages.

const STORAGE_PREFIX = 'invitation:v1:';
const SAVE_DELAY_MS = 400;

type InvitationsContextValue = {
  invitations: Record<string, Invitation>;
  load: (projectId: string) => Promise<void>;
  mutate: (projectId: string, fn: (inv: Invitation) => Invitation) => void;
};

const InvitationsContext = createContext<InvitationsContextValue | null>(null);

function emptyInvitation(projectId: string): Invitation {
  return { projectId, font: 'pretendard', pages: { invite: [], popup: [], thanks: [] } };
}

export function InvitationsProvider({ children }: { children: ReactNode }) {
  const [invitations, setInvitations] = useState<Record<string, Invitation>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const loading = useRef(new Set<string>());

  const load = useCallback(async (projectId: string) => {
    if (loading.current.has(projectId)) return;
    loading.current.add(projectId);
    let inv = emptyInvitation(projectId);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_PREFIX + projectId);
      if (raw) {
        // Older saves have no 안내 팝업 page yet.
        const saved = JSON.parse(raw) as Invitation;
        inv = { ...inv, ...saved, pages: { ...inv.pages, ...saved.pages } };
      }
    } catch (e) {
      console.warn('invitation load failed:', e);
    }
    setInvitations((prev) => (prev[projectId] ? prev : { ...prev, [projectId]: inv }));
  }, []);

  const scheduleSave = useCallback((inv: Invitation) => {
    const id = inv.projectId;
    if (timers.current[id]) clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(inv)).catch((e) => console.warn('invitation save failed:', e));
    }, SAVE_DELAY_MS);
  }, []);

  const mutate = useCallback(
    (projectId: string, fn: (inv: Invitation) => Invitation) => {
      setInvitations((prev) => {
        const current = prev[projectId] ?? emptyInvitation(projectId);
        const next = fn(current);
        if (next === current) return prev;
        scheduleSave(next);
        return { ...prev, [projectId]: next };
      });
    },
    [scheduleSave],
  );

  useEffect(() => {
    const pendingTimers = timers.current;
    return () => Object.values(pendingTimers).forEach(clearTimeout);
  }, []);

  const value = useMemo(() => ({ invitations, load, mutate }), [invitations, load, mutate]);
  return <InvitationsContext.Provider value={value}>{children}</InvitationsContext.Provider>;
}

/** Sets up a brand-new invitation (e.g. the 기본 글꼴 picked on the last new-project step). */
export function useStartInvitation() {
  const ctx = useContext(InvitationsContext);
  if (!ctx) throw new Error('useStartInvitation must be used within an InvitationsProvider');
  const { mutate } = ctx;
  return useCallback(
    (projectId: string, init: Partial<Omit<Invitation, 'projectId'>>) => mutate(projectId, () => ({ ...emptyInvitation(projectId), ...init })),
    [mutate],
  );
}

export const DEFAULT_THANKS_PAGE: ThanksPage = { mode: 'simple', simple: { showSender: true } };

function withPage(inv: Invitation, page: PageKey, blocks: Block[]): Invitation {
  return { ...inv, pages: { ...inv.pages, [page]: blocks } };
}

/** One invitation plus every edit the editor needs, bound to a project. */
export function useInvitation(projectId: string) {
  const ctx = useContext(InvitationsContext);
  if (!ctx) throw new Error('useInvitation must be used within an InvitationsProvider');
  const { invitations, load, mutate } = ctx;

  useEffect(() => {
    load(projectId);
  }, [projectId, load]);

  const edit = useCallback((fn: (inv: Invitation) => Invitation) => mutate(projectId, fn), [mutate, projectId]);

  const actions = useMemo(
    () => ({
      setFont: (font: FontId) => edit((inv) => ({ ...inv, font })),
      setCoverPhoto: (coverPhotoId: string | undefined) => edit((inv) => ({ ...inv, coverPhotoId })),
      setBgm: (bgm: Bgm) => edit((inv) => ({ ...inv, bgm })),
      setPopupEnabled: (enabled: boolean) => edit((inv) => ({ ...inv, popup: { enabled } })),
      updateThanks: (fn: (t: ThanksPage) => ThanksPage) => edit((inv) => ({ ...inv, thanks: fn(inv.thanks ?? DEFAULT_THANKS_PAGE) })),
      /** Replaces a whole page at once (감사페이지 간단 ↔ 자유 전환). */
      setPage: (page: PageKey, blocks: Block[]) => edit((inv) => withPage(inv, page, blocks)),
      /** Inserts at `index` (end when omitted). */
      insertBlock: (page: PageKey, block: Block, index?: number) =>
        edit((inv) => {
          const list = [...inv.pages[page]];
          list.splice(index ?? list.length, 0, block);
          return withPage(inv, page, list);
        }),
      updateBlock: (page: PageKey, id: string, fn: (b: Block) => Block) =>
        edit((inv) => withPage(inv, page, inv.pages[page].map((b) => (b.id === id ? fn(b) : b)))),
      removeBlock: (page: PageKey, id: string) =>
        edit((inv) => withPage(inv, page, inv.pages[page].filter((b) => b.id !== id))),
      /** 복제 — the copy lands right below the original; returns the copy's id. */
      duplicateBlock: (page: PageKey, block: Block) => {
        const copy = cloneBlock(block);
        edit((inv) => {
          const list = [...inv.pages[page]];
          const i = list.findIndex((b) => b.id === block.id);
          if (i < 0) return inv;
          list.splice(i + 1, 0, copy);
          return withPage(inv, page, list);
        });
        return copy.id;
      },
      moveBlock: (page: PageKey, from: number, to: number) =>
        edit((inv) => {
          const list = [...inv.pages[page]];
          if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return inv;
          const [moved] = list.splice(from, 1);
          list.splice(to, 0, moved);
          return withPage(inv, page, list);
        }),
    }),
    [edit],
  );

  return { invitation: invitations[projectId] as Invitation | undefined, ...actions };
}
