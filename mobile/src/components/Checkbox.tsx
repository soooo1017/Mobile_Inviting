import { Pressable, Text, StyleSheet } from 'react-native';
import { color, radius, size } from '../theme/tokens';

type Props = {
  checked: boolean;
  onPress: () => void;
  tone?: 'select' | 'error';
};

export function Checkbox({ checked, onPress, tone = 'select' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={[styles.box, checked && (tone === 'error' ? styles.checkedError : styles.checked)]}
    >
      {checked ? <Text style={styles.mark}>✓</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: size.checkbox,
    height: size.checkbox,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.line.strong,
    backgroundColor: color.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: color.accent.base,
    borderColor: color.accent.base,
  },
  checkedError: {
    backgroundColor: color.status.error,
    borderColor: color.status.error,
  },
  mark: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
