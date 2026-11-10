// 날짜 · 글 모양 도우미 — 앱의 editor/format.ts · thanks.ts · utils/projectStatus.ts 를 하객 화면용으로 옮긴 것.
// 하객 서버(Vercel)와 하객 폰의 시간대가 달라도 행사 시각이 똑같이 보이도록, 날짜는 모두 한국 시간(KST, UTC+9)으로 계산해요.

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
const KST_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

export type Kst = { y: number; m: number; d: number; h: number; min: number; dow: number };

export function kst(date: Date): Kst {
  const t = new Date(date.getTime() + KST_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), min: t.getUTCMinutes(), dow: t.getUTCDay() };
}

/** 그 날(한국 시간)의 시작 — 00:00 KST. */
export function startOfKstDay(date: Date): Date {
  const t = kst(date);
  return new Date(Date.UTC(t.y, t.m - 1, t.d) - KST_MS);
}

/** 한국 시간 기준 날짜 번호(1970-01-01 = 0) — 날짜끼리 며칠 차이인지 셀 때 써요. */
function kstDayNumber(date: Date): number {
  const t = kst(date);
  return Math.round(Date.UTC(t.y, t.m - 1, t.d) / DAY_MS);
}

/** 'YYYY-MM-DD' (한국 시간) */
export function kstDateKey(date: Date): string {
  const t = kst(date);
  return `${t.y}-${String(t.m).padStart(2, '0')}-${String(t.d).padStart(2, '0')}`;
}

/** "2027년 5월 22일 토요일 오후 1시" (분은 정각이 아닐 때만) */
export function formatWhen(iso: string): string {
  const t = kst(new Date(iso));
  const ampm = t.h < 12 ? '오전' : '오후';
  const h12 = t.h % 12 === 0 ? 12 : t.h % 12;
  return `${t.y}년 ${t.m}월 ${t.d}일 ${WEEKDAY[t.dow]}요일 ${ampm} ${h12}시${t.min ? ` ${t.min}분` : ''}`;
}

/** "D-222", 당일 "D-DAY", 지난 뒤 "D+3" */
export function formatDday(iso: string, now: Date): string {
  const diff = kstDayNumber(new Date(iso)) - kstDayNumber(now);
  if (diff === 0) return 'D-DAY';
  return diff > 0 ? `D-${diff}` : `D+${-diff}`;
}

/** 달력: 7칸씩, 앞 · 뒤 빈칸은 null. */
export function monthGrid(iso: string): (number | null)[] {
  const t = kst(new Date(iso));
  const firstDow = new Date(Date.UTC(t.y, t.m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(t.y, t.m, 0)).getUTCDate();
  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let i = 1; i <= days; i++) cells.push(i);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function weekdayLabels() {
  return WEEKDAY;
}

/** "5월 15일(토)" */
export function formatDeadline(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${m}월 ${d}일(${WEEKDAY[dow]})`;
}

/** 응답은 정한 날 끝(자정)까지 받아요. */
export function isPastDeadline(key: string | undefined, now: Date): boolean {
  if (!key) return false;
  return kstDateKey(now) > key;
}

/** "5. 23." 방명록 글 날짜 */
export function formatMonthDay(iso: string): string {
  const t = kst(new Date(iso));
  return `${t.m}. ${t.d}.`;
}

/** 숫자만 넣어도 010-1234-5678 모양으로. */
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

export function shortBank(bank: string): string {
  const map: Record<string, string> = { KB국민은행: '국민', NH농협은행: '농협', IBK기업은행: '기업', SC제일은행: 'SC제일', KDB산업은행: '산업' };
  return map[bank] ?? bank.replace(/은행$/, '');
}

/** 어느 쪽 손님을 고르게 할지 — 결혼식 신랑측 · 신부측, 돌잔치 · 백일 아버지측 · 어머니측. 그 밖의 행사는 빈 목록이라 이 항목이 안 보여요. */
export function guestSides(eventType: string): [string, string] | [] {
  if (eventType === 'wedding') return ['신랑측', '신부측'];
  if (eventType === 'first_birthday' || eventType === '100days') return ['아버지측', '어머니측'];
  return [];
}

// ── 장소 ─────────────────────────────────────────────────────────────────────

export type Venue = { name: string; address: string } | null | undefined;

export function venueQuery(venue: Venue): string {
  if (!venue) return '';
  const address = venue.address.trim();
  return address && address !== venue.name.trim() ? address : venue.name.trim();
}

export function venueAddressLine(venue: Venue): string {
  if (!venue) return '';
  const address = venue.address.trim();
  return address === venue.name.trim() ? '' : address;
}

/** http(s)로 시작하는 주소만 열어요(javascript: 같은 건 막아요). 스킴이 없으면 https를 붙여요. */
export function safeHttpUrl(raw: string | undefined): string | null {
  const u = (raw ?? '').trim();
  if (!u) return null;
  const withScheme = /^https?:\/\//i.test(u) ? u : /^[a-z][a-z0-9+.-]*:/i.test(u) ? '' : `https://${u}`;
  if (!withScheme) return null;
  try {
    const url = new URL(withScheme);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** 버튼 블록의 링크 — 앱과 같은 규칙(점이 들어간 http(s) 주소). */
export function isValidUrl(url: string): boolean {
  return /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(url.trim());
}

export function mapUrl(app: 'naver' | 'kakao', query: string, customUrl: string): string {
  const custom = safeHttpUrl(customUrl);
  if (custom) return custom;
  const q = encodeURIComponent(query);
  return app === 'naver' ? `https://m.map.naver.com/search2/search.naver?query=${q}` : `https://m.map.kakao.com/actions/searchView?q=${q}`;
}

// ── 감사페이지 문구 ───────────────────────────────────────────────────────────

const THANKS_DEFAULTS: Record<string, { title: string; message: string }> = {
  wedding: {
    title: '감사합니다',
    message: '귀한 시간 내어 저희의 결혼을 축하해 주셔서 진심으로 감사드립니다.\n보내주신 따뜻한 마음 잊지 않고 서로 아끼며 예쁘게 살겠습니다.',
  },
  first_birthday: { title: '감사합니다', message: '바쁘신 중에도 아이의 첫 생일을 함께 축하해 주셔서 감사합니다.\n보내주신 사랑만큼 건강하고 밝게 키우겠습니다.' },
  '100days': { title: '감사합니다', message: '아이의 백일을 함께 축하해 주셔서 감사합니다.\n따뜻한 축복 덕분에 더 건강하게 키우겠습니다.' },
  birthday: { title: '고마워요', message: '제 생일을 함께 축하해 줘서 정말 고마워요.\n덕분에 잊지 못할 하루가 됐어요.' },
  housewarming: { title: '감사합니다', message: '새 보금자리에 찾아와 축하해 주셔서 감사합니다.\n언제든 편하게 놀러 오세요.' },
  opening: { title: '감사합니다', message: '개업을 축하해 주셔서 진심으로 감사드립니다.\n보내주신 응원에 보답할 수 있도록 정성을 다하겠습니다.' },
  reunion: { title: '고마워요', message: '오랜만에 함께해 줘서 고마워요.\n덕분에 즐거운 시간이었어요. 다음 모임에서 또 만나요.' },
  club: { title: '고마워요', message: '함께해 주셔서 고맙습니다.\n덕분에 즐거운 시간이었어요. 다음 모임에서 또 만나요.' },
  other: { title: '감사합니다', message: '귀한 시간 내어 함께해 주셔서 진심으로 감사드립니다.' },
};

function hasFinalConsonant(word: string): boolean {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

type Hosts = { label: string; name: string }[];

function defaultThanksSender(eventType: string, hosts: Hosts): string {
  const name = (i: number) => hosts[i]?.name?.trim() ?? '';
  const label = (i: number) => hosts[i]?.label ?? '';
  let from = '';
  switch (eventType) {
    case 'wedding':
      from = [0, 1].filter((i) => name(i)).map((i) => `${label(i)} ${name(i)}`).join(' · ');
      break;
    case 'first_birthday':
    case '100days':
      from = name(0) ? `${name(0)}${hasFinalConsonant(name(0)) ? '이네' : '네'}` : '';
      break;
    case 'opening':
      from = [name(0), name(1) && `${label(1)} ${name(1)}`].filter(Boolean).join(' · ');
      break;
    case 'reunion':
    case 'club':
      from = [name(0), name(1) && `${label(1)} ${name(1)}`].filter(Boolean).join(' ');
      break;
    case 'other':
      from = hosts
        .filter((h) => h.name?.trim())
        .map((h) => `${h.label} ${h.name.trim()}`.trim())
        .join(' · ');
      break;
    default:
      from = name(0);
  }
  return from ? `${from} 드림` : '';
}

export function resolveThanks(eventType: string, hosts: Hosts, simple: { title?: string; message?: string; showSender: boolean; sender?: string }) {
  const d = THANKS_DEFAULTS[eventType] ?? THANKS_DEFAULTS.other;
  return {
    title: simple.title ?? d.title,
    message: simple.message ?? d.message,
    sender: simple.showSender ? (simple.sender ?? defaultThanksSender(eventType, hosts)) : '',
  };
}

/**
 * 하객에게 보이는 이름(브라우저 탭 · 캘린더에 추가한 일정) — 주인이 목록에서 구분하려고 붙인 "초대장 이름"은 하객에게 보이지 않아요.
 * 주인공 이름으로 만들어요: 결혼식 "민석 · 지원", 돌잔치 "하준 돌잔치", 백일 "하준 백일", 동창회 · 동호회는 모임 이름. 이름이 없으면 "초대장".
 */
export function guestTitle(eventType: string, hosts: { label: string; name: string }[] | null | undefined): string {
  const names = (hosts ?? []).map((h) => h?.name?.trim() ?? '');
  switch (eventType) {
    case 'first_birthday':
      return names[0] ? `${names[0]} 돌잔치` : '초대장';
    case '100days':
      return names[0] ? `${names[0]} 백일` : '초대장';
    case 'reunion':
    case 'club':
      return names[0] || '초대장';
    default:
      return names.filter(Boolean).join(' · ') || '초대장';
  }
}

// ── 어떤 화면을 보여줄지 ──────────────────────────────────────────────────────

export type GuestView = 'invite' | 'thanks' | 'ended';

/**
 * 하객이 지금 보는 화면. 행사 날까지는 초대장, 행사 다음 날 0시부터는 감사페이지(쓰기로 했고 기간 안일 때),
 * 그 기간이 끝나면 "행사가 끝난 초대장이에요". 감사페이지를 안 쓰면 행사가 끝난 다음 날부터 바로 끝난 안내예요.
 */
export function guestView(eventAt: string, thanks: { enabled: boolean; days?: number } | undefined, now: Date): GuestView {
  const thanksStart = new Date(startOfKstDay(new Date(eventAt)).getTime() + DAY_MS);
  if (now < thanksStart) return 'invite';
  if (thanks?.enabled && thanks.days) {
    const thanksEnd = thanksStart.getTime() + thanks.days * DAY_MS - 1;
    if (now.getTime() <= thanksEnd) return 'thanks';
  }
  return 'ended';
}

/** 안내 팝업을 띄울 때인지: 행사 N일 전(한국 시간 날짜 기준)부터 행사 당일까지. startDays null = 공유하면 바로. */
export function popupActive(eventAt: string, startDays: number | null, now: Date): boolean {
  if (startDays === null) return true;
  const left = kstDayNumber(new Date(eventAt)) - kstDayNumber(now);
  return left <= startDays;
}

// ── 캘린더에 추가(.ics) ───────────────────────────────────────────────────────

function icsStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function icsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** 행사 시작부터 2시간짜리 일정 파일. */
export function buildIcs(title: string, startIso: string, location: string, uid: string): string {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MOISO//Invitation//KO',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}@moiso`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsText(title)}`,
    location ? `LOCATION:${icsText(location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}
