// Design tokens — ported 1:1 from docs/design/tokens.json (handoff package for A. 앱 공통 화면).
// Keep this file in sync with tokens.json if the design system is updated.

export const color = {
  bg: {
    canvas: '#f4f2ef',
    surface: '#ffffff',
    tabbar: '#fbfaf8',
    sheet: '#fbfaf8',
    placeholderFill: '#e7e1d9',
    segment: '#ebe7e1',
    cardPast: '#fbfaf8',
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
    tintSoft: '#f6f4fd',
    tintBorder: '#cdc6e0',
  },
  select: {
    fill: '#6d5bb0',
    on: '#ffffff',
    onSub: '#e6e1f5',
  },
  line: {
    default: '#e5dfd6',
    strong: '#d9d1c6',
    soft: '#efeae2',
    chip: '#ddd6cc',
    separator: '#e0d9cf',
    dashed: '#cfc7bb',
    focus: '#23212a',
  },
  status: {
    error: '#a04a4a',
    errorTint: '#f6ecea',
    errorBorder: '#e5c9c5',
    success: '#3f6b4f',
    successTint: '#e8f1ea',
    successBorder: '#c4d9ca',
  },
  overlay: {
    sheet: 'rgba(35,33,42,0.34)',
    modal: 'rgba(35,33,42,0.42)',
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
    chip: 12,
    body: 12.5,
    button2: 13,
    control: 13.5,
    title3: 15,
    sheetTitle: 15,
    modalTitle: 16,
    title2: 17,
    step: 18,
    listTitle: 19,
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
  cell: 6,
  input: 8,
  button: 10,
  card: 10,
  cardHome: 12,
  modal: 14,
  sheet: 16,
  pill: 999,
  circle: 9999,
} as const;

export const size = {
  screenHeight: 660,
  controlPadding: 13,
  buttonPaddingY: 14,
  avatar: 28,
  checkbox: 17,
  viewToggle: 28,
  thumbDetail: [62, 78] as [number, number],
  thumbRatio: 3 / 4,
  splashLogo: 64,
  successIcon: 52,
} as const;

export const shadow = {
  modal: '0 10px 30px rgba(35,33,42,0.18)',
  toast: '0 6px 18px rgba(35,33,42,0.20)',
} as const;

export const motion = {
  splashDuration: 1200,
  toastDuration: 3000,
} as const;

export type FontWeightKey = keyof typeof font.weight;
export type FontSizeKey = keyof typeof font.size;
export type LineHeightKey = keyof typeof font.lineHeight;
export type LetterSpacingKey = keyof typeof font.letterSpacing;
