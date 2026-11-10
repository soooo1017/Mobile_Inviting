// 앱의 mobile/src/editor/colors.ts 와 invitationTheme.ts 를 그대로 옮긴 것 — 앱 미리보기와 같은 색이 나와야 해요.
import type { TextColorChoice, ThemeColors } from './model';

type Rgb = { r: number; g: number; b: number };

export function normalizeHex(input: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return `#${h.toLowerCase()}`;
}

function hexToRgb(hex: string): Rgb {
  const h = normalizeHex(hex) ?? '#000000';
  return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const c = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** a·(1−t) + b·t */
export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex({ r: A.r + (B.r - A.r) * t, g: A.g + (B.g - A.g) * t, b: A.b + (B.b - A.b) * t });
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function readableOn(bg: string): string {
  return contrast(bg, '#111111') >= contrast(bg, '#ffffff') ? '#111111' : '#ffffff';
}

export function autoTextColor(bg: string): string {
  return contrast(bg, '#1f1f1f') >= contrast(bg, '#ffffff') ? '#1f1f1f' : '#ffffff';
}

export const MIN_TEXT_CONTRAST = 3;

export function isDarkColor(hex: string): boolean {
  return luminance(hex) < 0.3;
}

export type InvitationTheme = {
  paper: string;
  ink: string;
  inkSoft: string;
  rule: string;
  band: string;
  bandInk: string;
  accent: string;
  onAccent: string;
  accentInk: string;
  field: string;
  isDark: boolean;
};

type LegacyTheme = Omit<InvitationTheme, 'onAccent' | 'accentInk'>;

const LEGACY: Record<string, LegacyTheme> = {
  linen: { paper: '#e9e4d8', ink: '#3b332b', inkSoft: '#6e6457', rule: '#d8c3af', band: '#ddcdb8', bandInk: '#6b5442', accent: '#a8846a', field: '#f3efe6', isDark: false },
  lavender: { paper: '#eceafc', ink: '#2f2a3d', inkSoft: '#615a73', rule: '#d2cbef', band: '#ddd7f6', bandInk: '#4f4675', accent: '#7b6fb8', field: '#f6f5fe', isDark: false },
  blush: { paper: '#fbeae6', ink: '#3f2c29', inkSoft: '#77605b', rule: '#efc4ba', band: '#f6d3ca', bandInk: '#8a4d40', accent: '#d1806f', field: '#fdf5f3', isDark: false },
  garden: { paper: '#f6f0cf', ink: '#33351f', inkSoft: '#66684a', rule: '#d6dcae', band: '#e3e7bf', bandInk: '#56622f', accent: '#8aa35d', field: '#fbf8e8', isDark: false },
  sage: { paper: '#f4e3df', ink: '#33302c', inkSoft: '#6b635c', rule: '#cfdcd0', band: '#dde8de', bandInk: '#4d6a54', accent: '#7f9f86', field: '#faf1ef', isDark: false },
  ink: { paper: '#17151c', ink: '#f3f0f7', inkSoft: '#b9b3c4', rule: '#3a3644', band: '#2b2833', bandInk: '#e2dcef', accent: '#b6a8e6', field: '#221f29', isDark: true },
};

export const EVENT_RED = '#c4473f';
const TEXT_GRAY = '#5b5b5b';

function resolveTextColor(text: TextColorChoice, accent: string, bg: string): string {
  return text === 'black' ? autoTextColor(bg) : text === 'gray' ? TEXT_GRAY : text === 'accent' ? accent : text;
}

function finish(t: LegacyTheme): InvitationTheme {
  return { ...t, onAccent: readableOn(t.accent), accentInk: contrast(t.paper, t.accent) >= MIN_TEXT_CONTRAST ? t.accent : t.ink };
}

function deriveTheme({ bg, accent, text }: ThemeColors): InvitationTheme {
  const ink = resolveTextColor(text, accent, bg);
  const band = mix(accent, bg, 0.8);
  const isDark = isDarkColor(bg);
  return {
    paper: bg,
    ink,
    inkSoft: mix(ink, bg, 0.35),
    rule: mix(accent, bg, 0.55),
    band,
    bandInk: contrast(band, accent) >= MIN_TEXT_CONTRAST ? accent : ink,
    accent,
    onAccent: readableOn(accent),
    accentInk: contrast(bg, accent) >= MIN_TEXT_CONTRAST ? accent : ink,
    field: isDark ? mix(bg, '#ffffff', 0.08) : mix(bg, '#ffffff', 0.55),
    isDark,
  };
}

function validHex(v: unknown): v is string {
  return typeof v === 'string' && normalizeHex(v) !== null;
}

/** 서버가 준 색(없으면 예전 고정 테마, 그것도 없으면 리넨)으로 초대장 색을 만들어요. 값이 이상하면 안전하게 기본으로 돌아가요. */
export function themeFromMeta(colors: ThemeColors | null | undefined, themeId: string | null | undefined): InvitationTheme {
  if (colors && validHex(colors.bg) && validHex(colors.accent)) {
    const text = colors.text === 'black' || colors.text === 'gray' || colors.text === 'accent' || validHex(colors.text) ? colors.text : 'black';
    return deriveTheme({ bg: normalizeHex(colors.bg) as string, accent: normalizeHex(colors.accent) as string, text: validHex(text) ? (normalizeHex(text) as `#${string}`) : text });
  }
  return finish(LEGACY[themeId ?? ''] ?? LEGACY.linen);
}
