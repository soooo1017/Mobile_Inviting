// Colors the invitation canvas uses, derived from the B8 background theme.
// Text color is never user-picked (EDITOR_PLAN §4): dark on the five light
// themes, light on 잉크.

export type InvitationTheme = {
  paper: string;
  ink: string;
  inkSoft: string;
  rule: string;
  band: string;
  bandInk: string;
  /** Accent used for "테마 색" calendar circles and similar touches. */
  accent: string;
  /** Raised surfaces on the canvas (guest inputs, collapsed panels). */
  field: string;
  isDark: boolean;
};

const THEMES: Record<string, InvitationTheme> = {
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

export function invitationTheme(themeId: string): InvitationTheme {
  return THEMES[themeId] ?? THEMES.linen;
}
