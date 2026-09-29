import type { TextStyle } from 'react-native';
import { font, type FontSizeKey, type FontWeightKey, type LetterSpacingKey, type LineHeightKey } from './tokens';

type TextStyleOptions = {
  size: FontSizeKey;
  weight?: FontWeightKey;
  lineHeight?: LineHeightKey;
  letterSpacing?: LetterSpacingKey;
  color?: string;
};

const fontFamilyByWeight: Record<FontWeightKey, string> = {
  regular: font.family.regular,
  medium: font.family.medium,
  semibold: font.family.semibold,
};

// Custom fonts on Android ignore the `fontWeight` prop, so we always select
// the family for the requested weight instead of relying on bold synthesis.
export function textStyle({ size, weight = 'regular', lineHeight, letterSpacing, color }: TextStyleOptions): TextStyle {
  const fontSize = font.size[size];
  const style: TextStyle = {
    fontFamily: fontFamilyByWeight[weight],
    fontSize,
  };
  if (lineHeight) {
    style.lineHeight = Math.round(fontSize * font.lineHeight[lineHeight] * 100) / 100;
  }
  if (letterSpacing) {
    style.letterSpacing = fontSize * font.letterSpacing[letterSpacing];
  }
  if (color) {
    style.color = color;
  }
  return style;
}

// tabular numerals for dates/times/D-day, per the design spec's numeric rule.
export const tnum: TextStyle = { fontVariant: ['tabular-nums'] };
