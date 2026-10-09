import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { BottomSheet } from '../../components/BottomSheet';
import { SelectChip } from '../../components/SelectChip';
import { PrimaryButton } from '../../components/PrimaryButton';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import type { Project, ThanksSettings } from '../../types/project';
import { thanksEndDate, thanksStartDate, formatMonthDay } from '../../utils/projectStatus';

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

type Props = {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
  onSave: (thanks: ThanksSettings) => void;
};

export function PeriodSheet({ visible, project, onClose, onSave }: Props) {
  const [enabled, setEnabled] = useState(true);
  const [days, setDays] = useState<number>(7);
  const [wasVisible, setWasVisible] = useState(visible);

  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible && project) {
      setEnabled(project.thanks.enabled);
      setDays(project.thanks.days ?? 7);
    }
  }

  if (!project) return null;

  const start = thanksStartDate(new Date(project.eventAt));
  const end = thanksEndDate(start, days);
  const period = `${formatMonthDay(start.toISOString())} ~ ${formatMonthDay(end.toISOString())} (${days}일)`;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="감사 페이지 기간">
      <View style={styles.body}>
        <Pressable style={[styles.toggle, enabled && styles.toggleSelected]} onPress={() => setEnabled(true)}>
          <Text style={[styles.toggleLabel, enabled && styles.toggleLabelSelected]}>감사 페이지 설정하기</Text>
        </Pressable>
        <Pressable style={[styles.toggle, !enabled && styles.toggleSelected]} onPress={() => setEnabled(false)}>
          <Text style={[styles.toggleLabel, !enabled && styles.toggleLabelSelected]}>감사 페이지 설정하지 않기</Text>
        </Pressable>

        {enabled ? (
          <>
            <View style={styles.dayRow}>
              {DAYS.map((d) => (
                <View key={d} style={styles.dayCellWrap}>
                  <SelectChip label={`${d}일`} shape="cell" selected={days === d} onPress={() => setDays(d)} />
                </View>
              ))}
            </View>
            <View style={styles.preview}>
              <Text style={styles.previewText}>기간 : {period}</Text>
            </View>
          </>
        ) : null}

        <PrimaryButton
          label="저장"
          onPress={() => onSave({ enabled, days: enabled ? (days as ThanksSettings['days']) : undefined, hasContent: project.thanks.hasContent })}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: space.screenX,
    gap: space[5],
  },
  toggle: {
    borderWidth: 1,
    borderColor: color.line.chip,
    borderRadius: radius.button,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: color.bg.surface,
  },
  toggleSelected: {
    backgroundColor: color.select.fill,
    borderColor: color.select.fill,
  },
  toggleLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  toggleLabelSelected: {
    color: color.select.on,
  },
  dayRow: {
    flexDirection: 'row',
    gap: space[3],
  },
  dayCellWrap: {
    flex: 1,
  },
  preview: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.input,
    padding: space[6],
  },
  previewText: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.primary }),
  },
});
