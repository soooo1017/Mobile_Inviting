import { Pressable, Text, StyleSheet } from 'react-native';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = {
  onPress: () => void;
};

export function BackButton({ onPress }: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.wrap}>
      {({ pressed }) => (
        <Text style={[styles.arrow, pressed && styles.pressed]}>←</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    marginTop: space[7],
  },
  arrow: {
    ...textStyle({ size: 'title2', weight: 'regular', color: color.ink.primary }),
  },
  pressed: {
    opacity: 0.85,
  },
});
