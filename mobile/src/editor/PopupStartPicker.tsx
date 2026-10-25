import { Text, View, StyleSheet } from 'react-native';
import { SelectChip } from '../components/SelectChip';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { POPUP_START_OPTIONS } from './types';
import { formatMonthDay } from '../utils/projectStatus';

/** 안내 팝업이 언제부터 뜨는지 — 행사 며칠 전부터. 새 초대장 · ⚙ 전체 설정 · 프로젝트 설정에서 같이 써요. */
export function PopupStartPicker({ eventAt, value, onChange }: { eventAt: string; value: number | null; onChange: (startDays: number | null) => void }) {
  let note = '공유를 시작하면 바로 떠요. 행사가 끝나면 더 이상 안 떠요.';
  if (value !== null) {
    const start = new Date(eventAt);
    start.setDate(start.getDate() - value);
    note = `${formatMonthDay(start.toISOString())}부터 떠요${value === 0 ? ' (행사 당일)' : ` (행사 ${value}일 전)`}. 행사가 끝나면 더 이상 안 떠요.`;
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>언제부터 보여줄까요?</Text>
      <View style={styles.chips}>
        {POPUP_START_OPTIONS.map((o) => (
          <SelectChip key={o.label} label={o.label} selected={value === o.value} onPress={() => onChange(o.value)} />
        ))}
      </View>
      <Text style={styles.note}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[4] },
  label: { ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.label }) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  note: { ...textStyle({ size: 'micro', weight: 'regular', color: color.ink.muted }), lineHeight: 12.5 * 1.6 },
});
