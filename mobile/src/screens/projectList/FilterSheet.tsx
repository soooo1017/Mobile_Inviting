import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { BottomSheet } from '../../components/BottomSheet';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SelectChip } from '../../components/SelectChip';
import { color, size, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import {
  EVENT_TYPES,
  EMPTY_FILTERS,
  SIDO_LIST,
  STATUS_LABEL,
  type FilterState,
  type Project,
  type ProjectStatus,
} from '../../types/project';
import { matchesFilters, matchesQuery } from '../../utils/projectFilters';

const STATUS_ORDER: ProjectStatus[] = ['draft', 'shared', 'thanks', 'past'];
const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);

type Props = {
  visible: boolean;
  filters: FilterState;
  allProjects: Project[];
  query: string;
  onApply: (filters: FilterState) => void;
  onClose: () => void;
};

export function FilterSheet({ visible, filters, allProjects, query, onApply, onClose }: Props) {
  const [draft, setDraft] = useState<FilterState>(filters);
  const [year, setYear] = useState(new Date().getFullYear());
  const [wasVisible, setWasVisible] = useState(visible);

  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(filters);
  }

  const resultCount = allProjects.filter((p) => matchesQuery(p, query) && matchesFilters(p, draft)).length;

  const toggleStatus = (status: ProjectStatus) => {
    setDraft((prev) => {
      const current = prev.status === 'all' ? [] : prev.status;
      const next = current.includes(status) ? current.filter((s) => s !== status) : [...current, status];
      return { ...prev, status: next.length === 0 ? 'all' : next };
    });
  };

  const toggleMonth = (key: string) => {
    setDraft((prev) => ({
      ...prev,
      months: prev.months.includes(key) ? prev.months.filter((m) => m !== key) : [...prev.months, key],
    }));
  };

  const toggleType = (type: Project['eventType']) => {
    setDraft((prev) => ({
      ...prev,
      types: prev.types.includes(type) ? prev.types.filter((t) => t !== type) : [...prev.types, type],
    }));
  };

  const toggleSido = (sido: string) => {
    setDraft((prev) => ({
      ...prev,
      sido: prev.sido.includes(sido) ? prev.sido.filter((s) => s !== sido) : [...prev.sido, sido],
    }));
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="필터" maxHeight={size.screenHeight * (3 / 4)}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Section title="초대장 상태">
          <View style={styles.chipWrap}>
            <SelectChip label="전체" selected={draft.status === 'all'} onPress={() => setDraft((p) => ({ ...p, status: 'all' }))} />
            {STATUS_ORDER.map((s) => (
              <SelectChip key={s} label={STATUS_LABEL[s]} selected={draft.status !== 'all' && draft.status.includes(s)} onPress={() => toggleStatus(s)} />
            ))}
          </View>
        </Section>

        <Section title="행사 월">
          <View style={styles.yearNav}>
            <Pressable onPress={() => setYear((y) => y - 1)} hitSlop={8}><Text style={styles.yearArrow}>‹</Text></Pressable>
            <Text style={styles.yearLabel}>{year}년</Text>
            <Pressable onPress={() => setYear((y) => y + 1)} hitSlop={8}><Text style={styles.yearArrow}>›</Text></Pressable>
          </View>
          <View style={styles.monthGrid}>
            {MONTH_LABELS.map((label, i) => {
              const key = `${year}-${String(i + 1).padStart(2, '0')}`;
              return (
                <View key={key} style={styles.monthCellWrap}>
                  <SelectChip label={label} shape="cell" selected={draft.months.includes(key)} onPress={() => toggleMonth(key)} />
                </View>
              );
            })}
          </View>
        </Section>

        <Section title="행사 종류">
          <View style={styles.chipWrap}>
            {EVENT_TYPES.map((t) => (
              <SelectChip key={t.type} label={t.label} selected={draft.types.includes(t.type)} onPress={() => toggleType(t.type)} />
            ))}
          </View>
        </Section>

        <Section title="장소 지역">
          <View style={styles.chipWrap}>
            {SIDO_LIST.map((s) => (
              <SelectChip key={s} label={s} selected={draft.sido.includes(s)} onPress={() => toggleSido(s)} />
            ))}
          </View>
        </Section>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.resetButton} onPress={() => setDraft(EMPTY_FILTERS)}>
          <Text style={styles.resetLabel}>초기화</Text>
        </Pressable>
        <View style={styles.applyButtonWrap}>
          <PrimaryButton label={`결과 ${resultCount}개 보기`} onPress={() => onApply(draft)} />
        </View>
      </View>
    </BottomSheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: space.screenX,
  },
  scrollContent: {
    gap: 26,
    paddingBottom: space[6],
  },
  section: {
    gap: space[6],
  },
  sectionTitle: {
    ...textStyle({ size: 'body', weight: 'semibold', color: color.ink.primary }),
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[4],
  },
  yearNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
  },
  yearArrow: {
    ...textStyle({ size: 'title2', weight: 'regular', color: color.ink.secondary }),
  },
  yearLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
  },
  monthCellWrap: {
    width: '22.5%',
  },
  footer: {
    flexDirection: 'row',
    gap: space[5],
    paddingHorizontal: space.screenX,
    paddingTop: space[6],
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
  },
  resetButton: {
    paddingHorizontal: space[8],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.line.chip,
    backgroundColor: color.bg.surface,
  },
  resetLabel: {
    ...textStyle({ size: 'control', weight: 'medium', color: color.ink.primary }),
  },
  applyButtonWrap: {
    flex: 1,
  },
});
