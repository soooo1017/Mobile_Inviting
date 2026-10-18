import type { EventType } from '../types/project';
import { BLOCK_LABEL, FORMAT_LABEL, GAP_LABEL, type Block } from './types';

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

/** "2027년 5월 22일 토요일 오후 1시" (minutes only when not on the hour). */
export function formatWhen(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const min = d.getMinutes();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAY[d.getDay()]}요일 ${ampm} ${h12}시${min ? ` ${min}분` : ''}`;
}

/** "2027. 5. 22. (토) 오후 1:00" — compact form for edit sheets. */
export function formatWhenShort(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. (${WEEKDAY[d.getDay()]}) ${ampm} ${h12}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** D-day band text: "D-222", "D-DAY" on the day, "D+3" after. */
export function formatDday(iso: string, now: Date = new Date()): string {
  const diff = Math.round((startOfDay(new Date(iso)).getTime() - startOfDay(now).getTime()) / 86400000);
  if (diff === 0) return 'D-DAY';
  return diff > 0 ? `D-${diff}` : `D+${-diff}`;
}

/** Month grid for the calendar: 7 columns, leading/trailing blanks as null. */
export function monthGrid(iso: string): (number | null)[] {
  const d = new Date(iso);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = Array(first.getDay()).fill(null);
  for (let i = 1; i <= days; i++) cells.push(i);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function weekdayLabels() {
  return WEEKDAY;
}

/** 'YYYY-MM-DD' in local time. */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "5월 15일(토)" */
export function formatDeadline(key: string): string {
  const d = fromDateKey(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${WEEKDAY[d.getDay()]})`;
}

/** Responses close at the end of the chosen day (자정). */
export function isPastDeadline(key: string | undefined, now: Date = new Date()): boolean {
  if (!key) return false;
  const end = fromDateKey(key);
  end.setHours(23, 59, 59, 999);
  return now.getTime() > end.getTime();
}

/** Digits in, Korean phone format out: 010-1234-5678, 02-123-4567, 031-123-4567. */
export function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 11);
  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/** 호칭 suggestion chips, matched to the event type (돌잔치 → 아이·아버지·어머니). */
export function roleSuggestions(eventType: EventType, hostLabels: string[]): string[] {
  if (eventType === 'wedding') return ['신랑', '신부', '아버지', '어머니'];
  if (eventType === 'first_birthday' || eventType === '100days') return ['아이', '아버지', '어머니'];
  const hosts = hostLabels.filter((l) => l && l !== '부모님');
  return Array.from(new Set([...hosts, '아버지', '어머니']));
}

export const BANKS = [
  'KB국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  'NH농협은행',
  'IBK기업은행',
  'SC제일은행',
  '카카오뱅크',
  '토스뱅크',
  '케이뱅크',
  '부산은행',
  '대구은행',
  '경남은행',
  '광주은행',
  '전북은행',
  '제주은행',
  '수협은행',
  '새마을금고',
  '신협',
  '우체국',
  '씨티은행',
  'KDB산업은행',
];

/** Short bank name for the guest view ("KB국민은행" → "국민"). */
export function shortBank(bank: string): string {
  const map: Record<string, string> = {
    KB국민은행: '국민',
    NH농협은행: '농협',
    IBK기업은행: '기업',
    SC제일은행: 'SC제일',
    KDB산업은행: '산업',
  };
  return map[bank] ?? bank.replace(/은행$/, '');
}

function clip(s: string, n = 18): string {
  const one = s.replace(/\s+/g, ' ').trim();
  return one.length > n ? `${one.slice(0, n)}…` : one;
}

/** One-line description used by the 순서 편집 summary cards and the add-sheet location line. */
export function blockSummary(block: Block): string {
  switch (block.type) {
    case 'text':
      return `${FORMAT_LABEL[block.props.format]} · ${block.props.content ? clip(block.props.content) : '내용 없음'}`;
    case 'image':
      return block.props.photo ? `사진 1장 · ${block.props.ratio === 'original' ? '원본' : block.props.ratio}` : '사진 없음';
    case 'gallery':
      return `사진 ${block.props.photos.length}장 · ${{ single: '1열', grid: '2열 그리드', slide: '슬라이드' }[block.props.layout]}`;
    case 'divider':
      return `${{ line: '선', dashed: '점선', dots: '점', heart: '하트' }[block.props.shape]} · ${block.props.length === 'short' ? '짧게' : '길게'}`;
    case 'spacer':
      return GAP_LABEL[block.props.height];
    case 'button':
      return block.props.label ? clip(block.props.label) : '문구 없음';
    case 'phone':
      return block.props.contacts.length ? `${block.props.contacts.length}명 · ${clip(block.props.contacts.map((c) => c.name).join(', '), 14)}` : '연락처 없음';
    case 'email':
      return block.props.entries.length ? `${block.props.entries.length}개 · ${clip(block.props.entries.map((e) => e.name || e.email).join(', '), 14)}` : '이메일 없음';
    case 'datetime':
      return [block.props.showWhen && '일시', block.props.showDday && 'D-day', block.props.showCalendar && '달력'].filter(Boolean).join(' · ') || '모두 꺼짐';
    case 'rsvp':
      return block.props.deadline ? `${formatDeadline(block.props.deadline)}까지` : '마감 없음';
    case 'guestbook':
      return block.props.visibility === 'public' ? '공개' : '우리만 보기';
    case 'account':
      return `${clip(block.props.title, 12)} · ${block.props.accounts.length}개`;
  }
}

export function blockLabel(block: Block): string {
  return BLOCK_LABEL[block.type];
}
