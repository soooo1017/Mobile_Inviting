import type { Project, ProjectStatus } from '../types/project';

export type ThanksBanner = { tone: 'soon' | 'warn'; text: string } | null;

/** 안내 띠 — 공유중 상태 + D-7부터, thanks.enabled일 때만 (자세한 카드형/리스트형 공용) */
export function getThanksBanner(project: Project, status: ProjectStatus, now: Date = new Date()): ThanksBanner {
  if (status !== 'shared' || !project.thanks.enabled) return null;
  if (dDayNumber(project.eventAt, now) > 7) return null;
  if (!project.thanks.hasContent) return { tone: 'warn', text: '감사 페이지가 비어 있어요' };
  const period = formatThanksPeriod(project);
  return { tone: 'soon', text: period ? `감사 페이지 기간 : ${period}` : '감사 페이지 기간이 설정됐어요' };
}

/** 썸네일형 보조칩 — D-7 조건과 무관하게, 감사 페이지를 설정한 작성중·공유중 카드에 항상 표시 */
export function shouldShowThanksSetChip(project: Project, status: ProjectStatus): boolean {
  return (status === 'draft' || status === 'shared') && project.thanks.enabled;
}

export function getBottomLine(project: Project, status: ProjectStatus): { text: string; accent: boolean } {
  switch (status) {
    case 'shared':
      return { text: `RSVP ${project.counts.rsvp} · 방명록 ${project.counts.guestbook}`, accent: true };
    case 'thanks':
      return { text: '감사 페이지 공개 중', accent: false };
    case 'past':
      return { text: '행사 완료', accent: false };
    case 'draft':
    default:
      return { text: formatRelativeEdit(project.updatedAt), accent: false };
  }
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

/** 행사 다음 날 00:00 */
export function thanksStartDate(eventAt: Date): Date {
  return addDays(startOfDay(eventAt), 1);
}

/** thanksStart + days일 - 1일, 그 날의 23:59:59.999 */
export function thanksEndDate(start: Date, days: number): Date {
  const end = addDays(start, days - 1);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getProjectStatus(project: Project, now: Date = new Date()): ProjectStatus {
  if (!project.shared) return 'draft';
  const eventDate = new Date(project.eventAt);
  const tStart = thanksStartDate(eventDate);
  if (now < tStart) return 'shared';
  if (project.thanks.enabled && project.thanks.days) {
    const tEnd = thanksEndDate(tStart, project.thanks.days);
    if (now <= tEnd) return 'thanks';
  }
  return 'past';
}

/** 행사일까지 남은 일수 (자정 기준) — 지났으면 음수 */
export function dDayNumber(eventAt: string, now: Date = new Date()): number {
  const diff = startOfDay(new Date(eventAt)).getTime() - startOfDay(now).getTime();
  return Math.round(diff / 86_400_000);
}

export function formatDday(eventAt: string, now: Date = new Date()): string {
  const n = dDayNumber(eventAt, now);
  if (n === 0) return 'D-DAY';
  return n > 0 ? `D-${n}` : `D+${Math.abs(n)}`;
}

export function formatEventDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. ${WEEKDAY_KO[d.getDay()]} ${hh}:${mm}`;
}

export function formatMonthDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}. ${d.getDate()}.`;
}

export function formatThanksPeriod(project: Project): string | null {
  if (!project.thanks.enabled || !project.thanks.days) return null;
  const start = thanksStartDate(new Date(project.eventAt));
  const end = thanksEndDate(start, project.thanks.days);
  return `${formatMonthDay(start.toISOString())} ~ ${formatMonthDay(end.toISOString())}`;
}

export function formatRelativeEdit(updatedAt: string, now: Date = new Date()): string {
  const diffDays = Math.round((startOfDay(now).getTime() - startOfDay(new Date(updatedAt)).getTime()) / 86_400_000);
  if (diffDays <= 0) return '오늘 수정';
  return `${diffDays}일 전 수정`;
}
