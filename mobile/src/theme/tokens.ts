// Design tokens — ported 1:1 from docs/design/tokens.json (handoff package for A. 앱 공통 화면).
// Keep this file in sync with tokens.json if the design system is updated.

export const color = {
  bg: {
    canvas: '#f4f2ef',
    surface: '#ffffff',
    tabbar: '#fbfaf8',
    placeholderFill: '#e7e1d9',
  },
  ink: {
    primary: '#23212a',
    onPrimary: '#f4f2ef',
    label: '#4f4b56',
    muted: '#7a7580',
    secondary: '#66626e',
    placeholder: '#a29ba8',
    inactive: '#9a95a0',
  },
  accent: {
    base: '#5f5486',
    tint: '#efedfd',
    tintBorder: '#cdc6e0',
  },
  line: {
    default: '#e5dfd6',
    strong: '#d9d1c6',
    soft: '#efeae2',
    separator: '#e0d9cf',
    dashed: '#cfc7bb',
    focus: '#23212a',
  },
  status: {
    error: '#a04a4a',
  },
  brand: {
    kakaoBg: '#fee500',
    kakaoInk: '#191600',
  },
} as const;

export const font = {
  family: {
    regular: 'Pretendard-Regular',
    medium: 'Pretendard-Medium',
    semibold: 'Pretendard-SemiBold',
  },
  size: {
    caption: 10,
    micro: 10.5,
    small: 11,
    label: 11.5,
    body: 12.5,
    control: 13.5,
    title3: 15,
    title2: 17,
    title1: 20,
    display: 21,
    hero: 23,
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
  },
  lineHeight: {
    tight: 1,
    heading: 1.35,
    body: 1.6,
    loose: 1.75,
  },
  letterSpacing: {
    heading: -0.025,
    title: -0.02,
    button: -0.01,
  },
} as const;

export const space = {
  1: 2,
  2: 4,
  3: 6,
  4: 7,
  5: 9,
  6: 12,
  7: 14,
  8: 18,
  9: 22,
  10: 26,
  screenX: 18,
} as const;

export const radius = {
  chip: 4,
  input: 8,
  button: 10,
  card: 12,
  pill: 999,
  circle: 9999,
} as const;

export const size = {
  controlPadding: 13,
  buttonPaddingY: 14,
  avatar: 28,
  checkbox: 17,
  splashLogo: 64,
  successIcon: 52,
} as const;

export const motion = {
  splashDuration: 1200,
} as const;

export type FontWeightKey = keyof typeof font.weight;
export type FontSizeKey = keyof typeof font.size;
export type LineHeightKey = keyof typeof font.lineHeight;
export type LetterSpacingKey = keyof typeof font.letterSpacing;
