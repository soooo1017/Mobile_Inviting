export type EventType =
  | 'wedding'
  | 'first_birthday'
  | '100days'
  | 'birthday'
  | 'housewarming'
  | 'opening'
  | 'reunion'
  | 'club'
  | 'other';

/**
 * 주인공(호스트) 입력 방식 — 행사 종류마다 달라요.
 * - fixed: 정해진 칸 (결혼식 신랑 · 신부 / 돌잔치 · 백일 아이 · 아버지 · 어머니 …)
 * - group: 모임명 + 직책(회장 · 부회장 · 총무 · 기타) + 이름 (동창회 · 동호회)
 * - free: 호스트 + 직접 추가(구분 + 이름) (기타)
 */
export type HostMode = 'fixed' | 'group' | 'free';

export type EventTypeMeta = {
  type: EventType;
  label: string;
  subtitle: string;
  hostMode: HostMode;
  /** 처음 만들어지는 칸 이름. group은 [모임명, 직책], free는 [호스트]. */
  hostLabels: string[];
  /** 앞에서부터 이만큼은 꼭 적어야 다음으로 가요. */
  requiredHosts: number;
};

export const EVENT_TYPES: EventTypeMeta[] = [
  { type: 'wedding', label: '결혼식', subtitle: '신랑 · 신부', hostMode: 'fixed', hostLabels: ['신랑', '신부'], requiredHosts: 2 },
  { type: 'first_birthday', label: '돌잔치', subtitle: '아이 · 아버지 · 어머니', hostMode: 'fixed', hostLabels: ['아이', '아버지', '어머니'], requiredHosts: 1 },
  { type: '100days', label: '백일', subtitle: '아이 · 아버지 · 어머니', hostMode: 'fixed', hostLabels: ['아이', '아버지', '어머니'], requiredHosts: 1 },
  { type: 'birthday', label: '생일파티', subtitle: '주인공', hostMode: 'fixed', hostLabels: ['주인공'], requiredHosts: 1 },
  { type: 'housewarming', label: '집들이', subtitle: '집주인', hostMode: 'fixed', hostLabels: ['집주인'], requiredHosts: 1 },
  { type: 'opening', label: '개업식', subtitle: '가게 · 대표', hostMode: 'fixed', hostLabels: ['가게', '대표'], requiredHosts: 2 },
  { type: 'reunion', label: '동창회', subtitle: '모임명 · 직책 · 이름', hostMode: 'group', hostLabels: ['모임명', '총무'], requiredHosts: 2 },
  { type: 'club', label: '동호회', subtitle: '모임명 · 직책 · 이름', hostMode: 'group', hostLabels: ['모임명', '총무'], requiredHosts: 2 },
  { type: 'other', label: '기타', subtitle: '호스트 직접 입력', hostMode: 'free', hostLabels: ['호스트'], requiredHosts: 1 },
];

/** 동창회 · 동호회 직책 선택지 (기타는 직접 입력). */
export const GROUP_ROLES = ['회장', '부회장', '총무'] as const;
/** 기타 행사에서 호스트를 더할 때 쓰는 구분 추천 칩. */
export const FREE_ROLES = ['회장', '부회장', '총무', '대표', '주최'] as const;
export const MAX_FREE_HOSTS = 6;

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
  /** Legacy fixed theme (이전 테마 6개). New invitations use `colors` instead; this keeps older ones looking the same. */
  themeId: string;
  /** 배경 · 포인트 · 글씨 색 picked on new-project step 4 / ⚙ 전체 설정. */
  colors?: ThemeColors;
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

/** Text color choices: the three presets or a custom '#rrggbb'. */
export type TextColorChoice = 'black' | 'gray' | 'accent' | `#${string}`;
export type ThemeColors = { bg: string; accent: string; text: TextColorChoice };

/** 색 조합 5가지 — two colors each; which one is 배경 and which 포인트 is up to the user (⇄ 바꾸기). */
export const COLOR_COMBOS: [string, string][] = [
  ['#ebf4f5', '#b5c6e0'],
  ['#faf0ca', '#0d3b66'],
  ['#f1f7ed', '#243e36'],
  ['#e7ecef', '#274c77'],
  ['#f3e9dc', '#c08552'],
];

export const DEFAULT_COLORS: ThemeColors = { bg: COLOR_COMBOS[0][0], accent: COLOR_COMBOS[0][1], text: 'black' };

export type ThemeOption = { id: string; name: string; colors: [string, string] };

/** The six themes projects used before 배경 · 포인트 색 existed — kept only to draw older invitations. */
export const LEGACY_THEMES: ThemeOption[] = [
  { id: 'linen', name: '리넨', colors: ['#e9e4d8', '#d8c3af'] },
  { id: 'lavender', name: '라벤더', colors: ['#eceafc', '#d9d3f5'] },
  { id: 'blush', name: '블러시', colors: ['#fbeae6', '#f4b3a6'] },
  { id: 'garden', name: '가든', colors: ['#f6f0cf', '#c7d9a8'] },
  { id: 'sage', name: '세이지', colors: ['#f4e3df', '#cfe0d2'] },
  { id: 'ink', name: '잉크', colors: ['#17151c', '#3a3644'] },
];
