import { Pressable, Text, StyleSheet } from 'react-native';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = {
  onPress: () => void;
};

/** 누르는 칸 안쪽 여백 — 화살표만 누르기 어렵지 않게 가로 · 세로 약 44pt가 되게 해요. */
const HIT = 12;

/**
 * ← 뒤로가기. 화살표가 화면 가장자리(좌우 여백 space.screenX)에서 떨어져 보이도록 스스로 왼쪽 여백을 가져요 —
 * 그래서 화면 맨 위에 그냥 놓으면 되고, 따로 가로 여백을 줄 필요가 없어요.
 */
export function BackButton({ onPress }: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={styles.wrap} accessibilityRole="button" accessibilityLabel="뒤로">
      {({ pressed }) => (
        <Text style={[styles.arrow, pressed && styles.pressed]}>←</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    marginTop: space[7] - HIT,
    marginLeft: space.screenX - HIT,
    padding: HIT,
  },
  arrow: {
    ...textStyle({ size: 'title2', weight: 'regular', color: color.ink.primary }),
  },
  pressed: {
    opacity: 0.85,
  },
});
