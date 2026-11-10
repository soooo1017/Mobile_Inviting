import type { Project, ProjectLink, ThanksSettings, Venue, ThemeColors, EventType } from '../types/project';
import type { Invitation } from '../editor/types';
import { isLinkLocked, linkSlug } from '../share/link';

/**
 * 폰의 초대장(Project + Invitation) ↔ 서버 `invitations` 한 줄 (supabase/schema.sql 9번, docs/SERVER_STORAGE.md §13).
 * 서버 표에 칸으로 두지 않은 설정은 `meta`에 넣어요 — 다른 폰에서 이어서 고칠 때 필요해서 하객에게는 안 보내요.
 */

export type ServerStatus = 'draft' | 'shared' | 'stopped';

/** 이어 편집에 필요한 나머지 설정. */
export type ProjectMeta = {
  v: 1;
  hosts: Project['hosts'];
  customTypeName?: string;
  venue?: Venue;
  themeId: string;
  colors?: ThemeColors;
  link?: Pick<ProjectLink, 'mode' | 'phrase' | 'rand'>;
  createdAt: string;
};

/** 서버에 올리는(insert · update) 내용. */
export type UpsertPayload = {
  local_id: string;
  slug: string;
  title: string;
  event_type: EventType;
  event_at: string;
  content: Omit<Invitation, 'projectId'>;
  thanks: ThanksSettings;
  meta: ProjectMeta;
  status: ServerStatus;
};

/** 서버에서 받아오는 한 줄. */
export type ServerRow = UpsertPayload & {
  id: string;
  owner_id: string;
  rev: number;
  last_device: string | null;
  updated_at: string;
  created_at: string;
};

/** 작성 중 = 링크를 아직 안 고정한 것, 공유 중 = shared, 한 번 공유했다 멈춘 것 = stopped. */
export function statusOf(project: Project): ServerStatus {
  if (project.shared) return 'shared';
  return isLinkLocked(project) ? 'stopped' : 'draft';
}

export function toPayload(project: Project, invitation: Invitation): UpsertPayload {
  const { projectId: _projectId, ...content } = invitation;
  void _projectId;
  return {
    local_id: project.id,
    slug: linkSlug(project),
    title: project.title,
    event_type: project.eventType,
    event_at: project.eventAt,
    content,
    thanks: project.thanks,
    meta: {
      v: 1,
      hosts: project.hosts,
      customTypeName: project.customTypeName,
      venue: project.venue,
      themeId: project.themeId,
      colors: project.colors,
      link: project.link ? { mode: project.link.mode, phrase: project.link.phrase, rand: project.link.rand } : undefined,
      createdAt: project.createdAt,
    },
    status: statusOf(project),
  };
}

/** 서버 한 줄 → 폰의 Project + Invitation. (응답 · 방명록 개수와 "새 소식" 표시는 폰에서만 관리해요.) */
export function fromRow(row: ServerRow, prev?: Project): { project: Project; invitation: Invitation } {
  const meta = row.meta;
  const locked = row.status !== 'draft';
  const project: Project = {
    id: row.local_id,
    title: row.title,
    eventType: row.event_type,
    customTypeName: meta?.customTypeName,
    hosts: meta?.hosts ?? [],
    eventAt: row.event_at,
    venue: meta?.venue,
    thanks: row.thanks,
    shared: row.status === 'shared',
    link: {
      slug: row.slug,
      mode: meta?.link?.mode ?? 'auto',
      phrase: meta?.link?.phrase ?? '',
      rand: meta?.link?.rand ?? '',
      locked,
    },
    themeId: meta?.themeId ?? 'ink',
    colors: meta?.colors,
    updatedAt: row.updated_at,
    createdAt: meta?.createdAt ?? row.created_at,
    counts: prev?.counts ?? { rsvp: 0, guestbook: 0 },
    seen: prev?.seen,
  };
  const invitation: Invitation = { ...(row.content as Omit<Invitation, 'projectId'>), projectId: row.local_id };
  // 예전에 저장된 내용에 없는 칸을 채워요(안내 팝업 · 감사페이지가 비어 있을 수 있어요).
  const saved = (row.content?.pages ?? {}) as Partial<Invitation['pages']>;
  invitation.pages = { invite: saved.invite ?? [], popup: saved.popup ?? [], thanks: saved.thanks ?? [] };
  return { project, invitation };
}

/** 키 순서와 상관없이 같은 내용이면 같은 글자가 되게 해요. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

/** 내용이 바뀌었는지 알아보는 짧은 지문 (djb2). */
export function hashOf(value: unknown): string {
  const text = stableStringify(value);
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `${text.length}:${(h >>> 0).toString(36)}`;
}
