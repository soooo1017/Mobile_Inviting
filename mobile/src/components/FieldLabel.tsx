import { Text, StyleSheet } from 'react-native';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = {
  children: string;
};

export function FieldLabel({ children }: Props) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.label }),
    marginBottom: space[4],
  },
});
