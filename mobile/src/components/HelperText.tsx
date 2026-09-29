import { Text, StyleSheet } from 'react-native';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = {
  children: string;
  error?: boolean;
};

export function HelperText({ children, error }: Props) {
  return (
    <Text style={[styles.text, error && styles.error]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  text: {
    ...textStyle({ size: 'micro', weight: 'regular', color: color.ink.muted }),
    marginTop: space[3],
  },
  error: {
    color: color.status.error,
  },
});
