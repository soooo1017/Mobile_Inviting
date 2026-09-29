import { Text, View, StyleSheet, type DimensionValue } from 'react-native';
import { color, radius } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = {
  width: DimensionValue;
  height: DimensionValue;
  label?: string;
  circle?: boolean;
};

// Dashed placeholder box for not-yet-decided content (logo, app name, etc.)
// per the handoff spec's Fidelity note — these stay as placeholders until
// branding is finalized.
export function Placeholder({ width, height, label, circle }: Props) {
  return (
    <View
      style={[
        styles.box,
        { width, height, borderRadius: circle ? radius.circle : radius.chip },
      ]}
    >
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.line.dashed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.placeholder }),
  },
});
