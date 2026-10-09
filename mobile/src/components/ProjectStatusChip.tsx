import { Text, View, StyleSheet } from 'react-native';
import { color, radius } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import type { ProjectStatus } from '../types/project';
import { STATUS_LABEL } from '../types/project';

type Variant = {
  textColor: string;
  bg: string;
  borderColor?: string;
};

const VARIANTS: Record<ProjectStatus, Variant> = {
  draft: { textColor: color.ink.secondary, bg: color.bg.surface, borderColor: color.line.chip },
  shared: { textColor: color.accent.base, bg: color.accent.tintSoft, borderColor: color.accent.tintBorder },
  thanks: { textColor: color.ink.secondary, bg: color.bg.placeholderFill },
  past: { textColor: color.ink.secondary, bg: 'transparent', borderColor: color.line.chip },
};

type Props = {
  status: ProjectStatus;
};

export function ProjectStatusChip({ status }: Props) {
  const v = VARIANTS[status];
  return (
    <View style={[styles.chip, { backgroundColor: v.bg, borderColor: v.borderColor ?? 'transparent' }, v.borderColor ? styles.bordered : null]}>
      <Text style={[styles.label, { color: v.textColor }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

// Thumbnail-view's secondary "감사 페이지 설정됨" chip — independent of status.
export function ThanksSetChip() {
  return (
    <View style={[styles.chip, styles.bordered, { backgroundColor: color.status.successTint, borderColor: color.status.successBorder }]}>
      <Text style={[styles.label, styles.labelSemibold, { color: color.status.success }]}>감사 페이지</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.chip,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  bordered: {
    borderWidth: 1,
  },
  label: {
    ...textStyle({ size: 'caption', weight: 'medium' }),
  },
  labelSemibold: {
    fontFamily: 'Pretendard-SemiBold',
  },
});
