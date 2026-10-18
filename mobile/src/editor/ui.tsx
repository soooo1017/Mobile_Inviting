import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, Switch, Text, View, StyleSheet } from 'react-native';
import { SelectChip } from '../components/SelectChip';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { GAP_LABEL, type GapSize } from './types';

// Small building blocks shared by every edit sheet, styled like the rest of
// the app (필터 칩 = SelectChip, 토글 = the same Switch as 알림 설정).

export function Section({ label, sub, children }: { label: string; sub?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>
        {label}
        {sub ? <Text style={styles.labelSub}>{`  ·  ${sub}`}</Text> : null}
      </Text>
      {children}
    </View>
  );
}

export function Chips<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <SelectChip key={String(o.value)} label={o.label} selected={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}

export type ToggleItem = { key: string; label: string; sub?: string; value: boolean; onChange?: (v: boolean) => void; fixedLabel?: string };

export function ToggleList({ items }: { items: ToggleItem[] }) {
  return (
    <View style={styles.card}>
      {items.map((t, i) => (
        <View key={t.key} style={[styles.toggleRow, i > 0 && styles.rowDivider]}>
          <Text style={styles.toggleLabel}>
            {t.label}
            {t.sub ? <Text style={styles.toggleSub}>{`  ${t.sub}`}</Text> : null}
          </Text>
          {t.fixedLabel ? (
            <Text style={styles.fixed}>{t.fixedLabel}</Text>
          ) : (
            <Switch
              value={t.value}
              onValueChange={t.onChange}
              trackColor={{ false: color.line.strong, true: color.select.fill }}
              thumbColor="#ffffff"
            />
          )}
        </View>
      ))}
    </View>
  );
}

const BAR: Record<GapSize, number> = { s: 5, m: 10, l: 17 };

/** 작게 / 보통 / 크게 tiles with a bar showing the actual height (여백 블록 · 그룹 블록 아래 여백). */
export function GapTiles({ value, onChange }: { value: GapSize; onChange: (v: GapSize) => void }) {
  return (
    <View style={styles.tiles}>
      {(['s', 'm', 'l'] as GapSize[]).map((g) => {
        const on = g === value;
        return (
          <Pressable key={g} onPress={() => onChange(g)} style={[styles.tile, on && styles.tileOn]}>
            <View style={[styles.bar, { height: BAR[g] }, on && styles.barOn]} />
            <Text style={[styles.tileLabel, on && styles.tileLabelOn]}>{GAP_LABEL[g]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SelectRow({ label, value, onPress, muted }: { label: string; value?: string; onPress: () => void; muted?: boolean }) {
  return (
    <Pressable onPress={onPress} style={styles.selectRow}>
      <Text style={[styles.selectLabel, muted && styles.selectMuted]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.selectValue} numberOfLines={1}>
        {value ? `${value}  ›` : '›'}
      </Text>
    </Pressable>
  );
}

export function Help({ children, error }: { children: string; error?: boolean }) {
  return <Text style={[styles.help, error && styles.helpError]}>{children}</Text>;
}

/** Dark toast — same look as the 순서 편집 "되돌리기" toast (복사 안내 등). */
export function DarkToast({
  message,
  actionLabel,
  onAction,
  onHide,
  bottom = 24,
}: {
  message: string | null;
  actionLabel?: string;
  onAction?: () => void;
  onHide: () => void;
  bottom?: number;
}) {
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!message) return;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => onHide());
    }, actionLabel ? 4000 : 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);
  if (!message) return null;
  return (
    <Animated.View style={[styles.toast, { bottom, opacity }]} pointerEvents="box-none">
      <Text style={styles.toastText}>{message}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.toastAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: space[3],
  },
  label: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.label }),
  },
  labelSub: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
  },
  card: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[6],
    paddingVertical: space[4],
    minHeight: 50,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
  },
  toggleLabel: {
    flex: 1,
    ...textStyle({ size: 'control', weight: 'medium', color: color.ink.primary }),
  },
  toggleSub: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  fixed: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  tiles: {
    flexDirection: 'row',
    gap: space[3],
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: space[3],
    borderWidth: 1,
    borderColor: color.line.chip,
    backgroundColor: color.bg.surface,
    borderRadius: radius.button,
    paddingTop: space[5],
    paddingBottom: space[4],
  },
  tileOn: {
    backgroundColor: color.select.fill,
    borderColor: color.select.fill,
  },
  bar: {
    width: '58%',
    borderRadius: 3,
    backgroundColor: color.line.strong,
  },
  barOn: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  tileLabel: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.primary }),
  },
  tileLabelOn: {
    color: color.select.on,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[4],
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.input,
    paddingHorizontal: 13,
    paddingVertical: 13,
  },
  selectLabel: {
    flexShrink: 1,
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.primary }),
  },
  selectMuted: {
    color: color.ink.placeholder,
  },
  selectValue: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  help: {
    ...textStyle({ size: 'micro', weight: 'regular', color: color.ink.muted }),
  },
  helpError: {
    color: color.status.error,
  },
  toast: {
    position: 'absolute',
    left: space.screenX,
    right: space.screenX,
    zIndex: 50,
    backgroundColor: color.ink.primary,
    borderRadius: radius.button,
    paddingVertical: space[5],
    paddingHorizontal: space[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toastText: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.onPrimary }),
  },
  toastAction: {
    ...textStyle({ size: 'label', weight: 'semibold', color: '#cdc6e0' }),
  },
});
