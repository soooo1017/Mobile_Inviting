import type { Project } from '../types/project';

export type Unread = { rsvp: number; guestbook: number; total: number };

/**
 * 새 소식 — 공유한 초대장에서 마지막으로 확인한 뒤 늘어난 참석 응답 · 방명록 글.
 * 참석 응답 현황 · 방명록 관리 화면을 열면 읽은 것으로 쳐서 사라져요 (ProjectsContext.markSeen).
 */
export function getUnread(project: Project): Unread {
  if (!project.shared) return { rsvp: 0, guestbook: 0, total: 0 };
  const seen = project.seen ?? project.counts;
  const rsvp = Math.max(0, project.counts.rsvp - seen.rsvp);
  const guestbook = Math.max(0, project.counts.guestbook - seen.guestbook);
  return { rsvp, guestbook, total: rsvp + guestbook };
}

/** "새 응답 2 · 새 방명록 3" */
export function unreadText(u: Unread): string {
  return [u.rsvp > 0 && `새 응답 ${u.rsvp}`, u.guestbook > 0 && `새 방명록 ${u.guestbook}`].filter(Boolean).join(' · ');
}
