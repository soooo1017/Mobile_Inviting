import { Pressable, Text, StyleSheet } from 'react-native';
import { color, radius } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  shape?: 'pill' | 'cell';
};

// Generic selectable chip used across filter/sort sheets — status, event
// type, and sido chips are pills; month-grid cells use the squarer shape.
// Selected state always follows the `select` token per the design spec.
export function SelectChip({ label, selected, onPress, shape = 'pill' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.base, shape === 'pill' ? styles.pill : styles.cell, selected && styles.selected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: color.line.chip,
    backgroundColor: color.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  cell: {
    borderRadius: radius.cell,
    paddingVertical: 10,
    flex: 1,
  },
  selected: {
    backgroundColor: color.select.fill,
    borderColor: color.select.fill,
  },
  label: {
    ...textStyle({ size: 'control', weight: 'medium', color: color.ink.primary }),
  },
  labelSelected: {
    color: color.select.on,
  },
});
