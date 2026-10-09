export type EventType =
  | 'wedding'
  | 'first_birthday'
  | '100days'
  | 'birthday'
  | 'housewarming'
  | 'opening'
  | 'reunion'
  | 'other';

export type EventTypeMeta = {
  type: EventType;
  label: string;
  subtitle: string;
  hostLabels: [string, string] | [string];
};

export const EVENT_TYPES: EventTypeMeta[] = [
  { type: 'wedding', label: '결혼식', subtitle: '신랑 · 신부', hostLabels: ['신랑', '신부'] },
  { type: 'first_birthday', label: '돌잔치', subtitle: '아이 · 부모님', hostLabels: ['아이', '부모님'] },
  { type: '100days', label: '백일', subtitle: '아이 · 부모님', hostLabels: ['아이', '부모님'] },
  { type: 'birthday', label: '생일파티', subtitle: '주인공', hostLabels: ['주인공'] },
  { type: 'housewarming', label: '집들이', subtitle: '집주인', hostLabels: ['집주인'] },
  { type: 'opening', label: '개업식', subtitle: '가게 · 대표', hostLabels: ['가게', '대표'] },
  { type: 'reunion', label: '동창회', subtitle: '모임 · 총무', hostLabels: ['모임', '총무'] },
  { type: 'other', label: '기타', subtitle: '직접 입력', hostLabels: ['주인공'] },
];

export function eventTypeMeta(type: EventType): EventTypeMeta {
  return EVENT_TYPES.find((t) => t.type === type) ?? EVENT_TYPES[0];
}

export type MapLink = 'naver' | 'kakao';

export type Venue = {
  name: string;
  address: string;
  sido: string;
  mapLinks: { naver: boolean; kakao: boolean };
};

export type ThanksSettings = {
  enabled: boolean;
  days?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  hasContent: boolean;
};

export type Project = {
  id: string;
  title: string;
  eventType: EventType;
  customTypeName?: string;
  hosts: { label: string; name: string }[];
  eventAt: string; // ISO
  venue?: Venue;
  thanks: ThanksSettings;
  shared: boolean;
  themeId: string;
  updatedAt: string; // ISO
  createdAt: string; // ISO
  counts: { rsvp: number; guestbook: number };
};

export type ProjectStatus = 'draft' | 'shared' | 'thanks' | 'past';

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: '작성중',
  shared: '공유중',
  thanks: '감사 페이지',
  past: '지난 행사',
};

export const SIDO_LIST = [
  '서울', '경기', '인천', '강원', '충북', '충남', '대전', '세종',
  '전북', '전남', '광주', '경북', '경남', '대구', '울산', '부산', '제주',
];

export type ListView = 'detail' | 'thumb' | 'list';
export type SortKey = 'updated' | 'eventDesc' | 'eventAsc' | 'created' | 'name';

export type FilterState = {
  status: ProjectStatus[] | 'all';
  months: string[]; // 'YYYY-MM'
  types: EventType[];
  sido: string[];
};

export const EMPTY_FILTERS: FilterState = { status: 'all', months: [], types: [], sido: [] };

export function filterCount(f: FilterState): number {
  const statusCount = f.status === 'all' ? 0 : f.status.length;
  return statusCount + f.months.length + f.types.length + f.sido.length;
}

export type ThemeOption = { id: string; name: string; colors: [string, string] };

export const THEMES: ThemeOption[] = [
  { id: 'linen', name: '리넨', colors: ['#e9e4d8', '#d8c3af'] },
  { id: 'lavender', name: '라벤더', colors: ['#eceafc', '#d9d3f5'] },
  { id: 'blush', name: '블러시', colors: ['#fbeae6', '#f4b3a6'] },
  { id: 'garden', name: '가든', colors: ['#f6f0cf', '#c7d9a8'] },
  { id: 'sage', name: '세이지', colors: ['#f4e3df', '#cfe0d2'] },
  { id: 'ink', name: '잉크', colors: ['#17151c', '#3a3644'] },
];
