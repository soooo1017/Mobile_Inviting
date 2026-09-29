import { Text, StyleSheet } from 'react-native';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = {
  children: string;
};

export function ScreenTitle({ children }: Props) {
  return <Text style={styles.title}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    ...textStyle({
      size: 'display',
      weight: 'semibold',
      lineHeight: 'heading',
      letterSpacing: 'heading',
      color: color.ink.primary,
    }),
    marginTop: space[9],
  },
});
