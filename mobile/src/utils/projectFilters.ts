import type { FilterState, Project, SortKey } from '../types/project';
import { getProjectStatus } from './projectStatus';

export function matchesQuery(project: Project, query: string): boolean {
  if (!query.trim()) return true;
  return project.title.toLowerCase().replace(/\s/g, '').includes(query.toLowerCase().replace(/\s/g, ''));
}

export function matchesFilters(project: Project, filters: FilterState, now: Date = new Date()): boolean {
  if (filters.status !== 'all') {
    const status = getProjectStatus(project, now);
    if (!filters.status.includes(status)) return false;
  }
  if (filters.months.length > 0) {
    const d = new Date(project.eventAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!filters.months.includes(key)) return false;
  }
  if (filters.types.length > 0 && !filters.types.includes(project.eventType)) return false;
  if (filters.sido.length > 0 && (!project.venue || !filters.sido.includes(project.venue.sido))) return false;
  return true;
}

export function sortProjects(projects: Project[], sort: SortKey): Project[] {
  const copy = [...projects];
  switch (sort) {
    case 'eventDesc':
      return copy.sort((a, b) => new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime());
    case 'eventAsc':
      return copy.sort((a, b) => new Date(a.eventAt).getTime() - new Date(b.eventAt).getTime());
    case 'created':
      return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'name':
      return copy.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    case 'updated':
    default:
      return copy.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

/**
 * 정렬 이름 — 지난 행사 · 다가올 행사 모두 헷갈리지 않게 "행사일"을 기준으로 빠른순 / 늦은순.
 * 빠른순 = 이른 날짜(지난 행사)가 위, 늦은순 = 나중 날짜(먼 미래)가 위.
 */
export const SORT_OPTIONS: { key: SortKey; label: string; desc: string }[] = [
  { key: 'updated', label: '최근 수정순', desc: '마지막으로 편집한 초대장부터' },
  { key: 'eventAsc', label: '행사일 빠른순', desc: '행사 날짜가 이른 것부터' },
  { key: 'eventDesc', label: '행사일 늦은순', desc: '행사 날짜가 나중인 것부터' },
  { key: 'created', label: '최근 만든순', desc: '' },
  { key: 'name', label: '이름순', desc: '가나다 · ABC' },
];
