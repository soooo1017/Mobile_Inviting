import { Text, View, StyleSheet } from 'react-native';
import { BackButton } from '../../components/BackButton';
import { color, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';

type Props = {
  onBack: () => void;
  step: number;
  stepLabel: string;
  title?: string;
};

export function WizardHeader({ onBack, step, stepLabel, title = '새 초대장' }: Props) {
  return (
    <View>
      <View style={styles.headerRow}>
        <BackButton onPress={onBack} />
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
      </View>
      <Text style={styles.stepLabel}>{step} / 4 · {stepLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingHorizontal: space.screenX,
  },
  headerTitle: {
    ...textStyle({ size: 'title2', weight: 'semibold', color: color.ink.primary }),
    marginTop: space[7],
  },
  progressTrack: {
    height: 2,
    backgroundColor: color.line.default,
    marginTop: space[6],
  },
  progressFill: {
    height: 2,
    backgroundColor: color.accent.base,
  },
  stepLabel: {
    ...textStyle({ size: 'micro', weight: 'medium', color: color.ink.secondary }),
    marginTop: space[4],
    marginLeft: space.screenX,
  },
});
