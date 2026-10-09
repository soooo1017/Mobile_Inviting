import { Pressable, Text, View, StyleSheet } from 'react-native';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
};

export function SelectTile({ title, subtitle, selected, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.tile, selected && styles.selected]}>
      <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, selected && styles.subtitleSelected]}>{subtitle}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.chip,
    borderRadius: radius.card,
    padding: space[7],
    gap: space[1],
  },
  selected: {
    backgroundColor: color.select.fill,
    borderColor: color.select.fill,
  },
  title: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  titleSelected: {
    color: color.select.on,
  },
  subtitle: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  subtitleSelected: {
    color: color.select.onSub,
  },
});

export function TileRow({ children }: { children: React.ReactNode }) {
  return <View style={rowStyles.row}>{children}</View>;
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space[5],
  },
});
