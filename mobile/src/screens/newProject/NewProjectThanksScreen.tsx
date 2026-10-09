import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useNewProjectDraft } from '../../state/NewProjectDraftContext';
import { WizardHeader } from './WizardHeader';
import { SelectChip } from '../../components/SelectChip';
import { PrimaryButton } from '../../components/PrimaryButton';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { thanksEndDate, thanksStartDate, formatMonthDay } from '../../utils/projectStatus';
import type { ThanksSettings } from '../../types/project';

type Props = NativeStackScreenProps<RootStackParamList, 'NewProjectThanks'>;

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export function NewProjectThanksScreen({ navigation }: Props) {
  const { draft, update } = useNewProjectDraft();
  const enabled = draft.thanks.enabled;
  const days = draft.thanks.days ?? 7;

  const setEnabled = (next: boolean) => {
    const thanks: ThanksSettings = { enabled: next, days: next ? days : undefined, hasContent: false };
    update({ thanks });
  };
  const setDays = (d: number) => update({ thanks: { ...draft.thanks, days: d as ThanksSettings['days'] } });

  const start = thanksStartDate(new Date(draft.eventAt));
  const end = thanksEndDate(start, days);
  const period = `${formatMonthDay(start.toISOString())} ~ ${formatMonthDay(end.toISOString())} (${days}일)`;

  return (
    <View style={styles.screen}>
      <WizardHeader onBack={() => navigation.goBack()} step={3} stepLabel="감사 페이지" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>행사 후 감사 페이지를{'\n'}보여줄까요?</Text>
        <Text style={styles.desc}>
          행사 다음 날 자정부터 공유한 링크가 감사 페이지로 바뀌어요.{'\n'}행사에 참석해주신 분에게 감사 인사를 드려요.
        </Text>

        <View style={styles.toggleGroup}>
          <Pressable style={[styles.toggle, enabled && styles.toggleSelected]} onPress={() => setEnabled(true)}>
            <Text style={[styles.toggleLabel, enabled && styles.toggleLabelSelected]}>감사 페이지 설정하기</Text>
          </Pressable>
          <Pressable style={[styles.toggle, !enabled && styles.toggleSelected]} onPress={() => setEnabled(false)}>
            <Text style={[styles.toggleLabel, !enabled && styles.toggleLabelSelected]}>감사 페이지 설정하지 않기</Text>
          </Pressable>
        </View>

        {enabled ? (
          <View style={styles.periodSection}>
            <View style={styles.periodHeader}>
              <Text style={styles.periodLabel}>공개 기간</Text>
              <Text style={styles.periodHint}>최소 1일 ~ 최대 7일</Text>
            </View>
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
          </View>
        ) : null}

        <Text style={styles.footerHelper}>
          감사 페이지 내용은 에디터에서 작성해요.{'\n'}페이지 전환 및 기간 등의 설정은 나중에 바꿀 수 있어요.
        </Text>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton label="다음" onPress={() => navigation.navigate('ThemeSelect')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  content: {
    paddingHorizontal: space.screenX,
    paddingTop: space[8],
  },
  title: {
    ...textStyle({ size: 'step', weight: 'semibold', lineHeight: 'heading', color: color.ink.primary }),
  },
  desc: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
    lineHeight: 11.5 * 1.5,
    marginTop: space[4],
  },
  toggleGroup: {
    gap: space[4],
    marginTop: space[8],
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
  periodSection: {
    marginTop: space[8],
    gap: space[5],
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodLabel: {
    ...textStyle({ size: 'body', weight: 'medium', color: color.ink.primary }),
  },
  periodHint: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
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
    borderRadius: 8,
    padding: space[6],
  },
  previewText: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.primary }),
  },
  footerHelper: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
    lineHeight: 11.5 * 1.5,
    marginTop: space[8],
  },
  footer: {
    paddingHorizontal: space.screenX,
    paddingBottom: space[9],
    paddingTop: space[6],
  },
});
