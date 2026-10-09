import { Pressable, Text, View, StyleSheet } from 'react-native';
import { BottomSheet } from '../../components/BottomSheet';
import { color, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import type { SortKey } from '../../types/project';
import { SORT_OPTIONS } from '../../utils/projectFilters';

type Props = {
  visible: boolean;
  value: SortKey;
  onSelect: (key: SortKey) => void;
  onClose: () => void;
};

export function SortSheet({ visible, value, onSelect, onClose }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="정렬">
      {SORT_OPTIONS.map((opt, i) => {
        const selected = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            style={[styles.row, i > 0 && styles.rowDivider]}
          >
            <View style={styles.rowText}>
              <Text style={[styles.label, selected && styles.labelSelected]}>{opt.label}</Text>
              {opt.desc ? <Text style={styles.desc}>{opt.desc}</Text> : null}
            </View>
            {selected ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>
        );
      })}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
    paddingVertical: space[7],
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
  },
  rowText: {
    gap: space[1],
  },
  label: {
    ...textStyle({ size: 'control', weight: 'medium', color: color.ink.primary }),
  },
  labelSelected: {
    color: color.accent.base,
    fontFamily: 'Pretendard-SemiBold',
  },
  desc: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  check: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.accent.base }),
  },
});
