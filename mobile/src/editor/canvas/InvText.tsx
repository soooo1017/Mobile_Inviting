import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { useFontFamily } from '../fonts';
import type { FontId } from '../types';
import { useCanvas } from './CanvasContext';

type Props = TextProps & {
  /** Block-level font override; falls back to the invitation's 기본 글꼴. */
  font?: FontId;
  bold?: boolean;
  size: number;
  /** Line height as a multiple of size. */
  leading?: number;
  soft?: boolean;
  style?: StyleProp<TextStyle>;
};

/** Text drawn in the invitation's own font and theme ink. */
export function InvText({ font, bold = false, size, leading = 1.6, soft = false, style, ...rest }: Props) {
  const { defaultFont, theme } = useCanvas();
  const fontFamily = useFontFamily(font ?? defaultFont, bold);
  return (
    <Text
      {...rest}
      style={[
        { fontFamily, fontSize: size, lineHeight: Math.round(size * leading), color: soft ? theme.inkSoft : theme.ink },
        style,
      ]}
    />
  );
}

/** UI text inside the invitation (numbers, addresses, small labels) — always Pretendard, like the wireframes. */
export function InvUiText({ size, soft = false, bold = false, style, ...rest }: Omit<Props, 'font' | 'leading'>) {
  const { theme } = useCanvas();
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: bold ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
          fontSize: size,
          color: soft ? theme.inkSoft : theme.ink,
        },
        style,
      ]}
    />
  );
}
