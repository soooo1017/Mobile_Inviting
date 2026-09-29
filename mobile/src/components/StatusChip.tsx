import { Text, View, StyleSheet } from 'react-native';
import { color, radius } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = {
  children: string;
};

export function StatusChip({ children }: Props) {
  return (
    <View style={styles.chip}>
      <Text style={styles.label}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: color.accent.tint,
    borderRadius: radius.chip,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  label: {
    ...textStyle({ size: 'caption', weight: 'medium', color: color.accent.base }),
  },
});
