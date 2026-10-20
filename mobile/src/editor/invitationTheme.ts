// Colors the invitation canvas uses. New invitations derive them from the picked
// 배경 · 포인트 · 글씨 색 (EDITOR_PLAN §4); invitations made with the old fixed
// themes keep their original look through LEGACY below.

import { contrast, isDarkColor, MIN_TEXT_CONTRAST, mix, readableOn } from './colors';
import type { Project, TextColorChoice, ThemeColors } from '../types/project';

export type InvitationTheme = {
  paper: string;
  ink: string;
  inkSoft: string;
  rule: string;
  band: string;
  bandInk: string;
  /** 포인트 색 — buttons, 달력 동그라미("테마 색"), 구분선 점 · 하트. */
  accent: string;
  /** Text on an accent-filled button (dark or white, whichever reads). */
  onAccent: string;
  /** Accent as text/border on the paper — falls back to the ink when the accent is too close to the paper. */
  accentInk: string;
  /** Raised surfaces on the canvas (guest inputs, collapsed panels). */
  field: string;
  isDark: boolean;
};

type LegacyTheme = Omit<InvitationTheme, 'onAccent' | 'accentInk'>;

const LEGACY: Record<string, LegacyTheme> = {
  linen: {
    paper: '#e9e4d8',
    ink: '#3b332b',
    inkSoft: '#6e6457',
    rule: '#d8c3af',
    band: '#ddcdb8',
    bandInk: '#6b5442',
    accent: '#a8846a',
    field: '#f3efe6',
    isDark: false,
  },
  lavender: {
    paper: '#eceafc',
    ink: '#2f2a3d',
    inkSoft: '#615a73',
    rule: '#d2cbef',
    band: '#ddd7f6',
    bandInk: '#4f4675',
    accent: '#7b6fb8',
    field: '#f6f5fe',
    isDark: false,
  },
  blush: {
    paper: '#fbeae6',
    ink: '#3f2c29',
    inkSoft: '#77605b',
    rule: '#efc4ba',
    band: '#f6d3ca',
    bandInk: '#8a4d40',
    accent: '#d1806f',
    field: '#fdf5f3',
    isDark: false,
  },
  garden: {
    paper: '#f6f0cf',
    ink: '#33351f',
    inkSoft: '#66684a',
    rule: '#d6dcae',
    band: '#e3e7bf',
    bandInk: '#56622f',
    accent: '#8aa35d',
    field: '#fbf8e8',
    isDark: false,
  },
  sage: {
    paper: '#f4e3df',
    ink: '#33302c',
    inkSoft: '#6b635c',
    rule: '#cfdcd0',
    band: '#dde8de',
    bandInk: '#4d6a54',
    accent: '#7f9f86',
    field: '#faf1ef',
    isDark: false,
  },
  ink: {
    paper: '#17151c',
    ink: '#f3f0f7',
    inkSoft: '#b9b3c4',
    rule: '#3a3644',
    band: '#2b2833',
    bandInk: '#e2dcef',
    accent: '#b6a8e6',
    field: '#221f29',
    isDark: true,
  },
};

export const EVENT_RED = '#c4473f';

const TEXT_BLACK = '#1f1f1f';
const TEXT_GRAY = '#5b5b5b';

export function resolveTextColor(text: TextColorChoice, accent: string): string {
  return text === 'black' ? TEXT_BLACK : text === 'gray' ? TEXT_GRAY : text === 'accent' ? accent : text;
}

function finish(t: LegacyTheme): InvitationTheme {
  return { ...t, onAccent: readableOn(t.accent), accentInk: contrast(t.paper, t.accent) >= MIN_TEXT_CONTRAST ? t.accent : t.ink };
}

/** Everything the canvas draws, derived from the two picked colors and the text color. */
export function deriveTheme({ bg, accent, text }: ThemeColors): InvitationTheme {
  const ink = resolveTextColor(text, accent);
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

/** The colors a project is drawn with — its own, or the ones of its old fixed theme. */
export function projectColors(project: Pick<Project, 'colors' | 'themeId'>): ThemeColors {
  if (project.colors) return project.colors;
  const t = LEGACY[project.themeId] ?? LEGACY.linen;
  return { bg: t.paper, accent: t.accent, text: t.isDark ? (t.ink as TextColorChoice) : 'black' };
}

export function invitationTheme(project: Pick<Project, 'colors' | 'themeId'>): InvitationTheme {
  if (project.colors) return deriveTheme(project.colors);
  return finish(LEGACY[project.themeId] ?? LEGACY.linen);
}
