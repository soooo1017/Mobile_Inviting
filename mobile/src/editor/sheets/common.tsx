import { useContext, useEffect, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { SelectChip } from '../../components/SelectChip';
import { TextField } from '../../components/TextField';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { DragList } from '../DragList';
import { ScrollLockContext } from '../EditorSheet';
import { FONTS, fontMeta, useInvitationFonts } from '../fonts';
import { Help } from '../ui';
import { LIMITS, type FontId } from '../types';
import type { Project } from '../../types/project';

export type SheetBase = { project: Project; defaultFont: FontId; onDone: () => void };

/** Font list where every name is drawn in its own font. `blockOverride` adds "기본 글꼴 사용" on top. */
export function FontList({
  value,
  defaultFont,
  onChange,
  mode,
}: {
  value: FontId | undefined;
  defaultFont: FontId;
  onChange: (font: FontId | undefined) => void;
  mode: 'block' | 'default';
}) {
  const { ensure, isLoaded } = useInvitationFonts();
  useEffect(() => {
    ensure(FONTS.map((f) => f.id));
  }, [ensure]);

  const list = mode === 'default' ? FONTS.filter((f) => f.canBeDefault) : FONTS;
  return (
    <View style={styles.fontCard}>
      {mode === 'block' ? (
        <Pressable style={[styles.fontRow, value === undefined && styles.fontRowOn]} onPress={() => onChange(undefined)}>
          <Text style={styles.fontDefault}>
            기본 글꼴 사용<Text style={styles.fontDefaultSub}>{`  ·  ${fontMeta(defaultFont).label}`}</Text>
          </Text>
          {value === undefined ? <Text style={styles.check}>✓</Text> : null}
        </Pressable>
      ) : null}
      {list.map((f) => {
        const on = mode === 'block' ? value === f.id : (value ?? defaultFont) === f.id;
        return (
          <Pressable key={f.id} style={[styles.fontRow, styles.rowDivider, on && styles.fontRowOn]} onPress={() => onChange(f.id)}>
            <Text style={[styles.fontName, { fontFamily: isLoaded(f.id) ? f.regular : 'Pretendard-Regular' }]} numberOfLines={1}>
              {f.label}
            </Text>
            {f.sub ? <Text style={styles.fontTag}>{f.sub}</Text> : null}
            {on ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** 호칭: suggestion chips for the event type + 직접 입력 (최대 7자). */
export function RoleField({ value, onChange, suggestions }: { value: string; onChange: (v: string) => void; suggestions: string[] }) {
  const isCustom = value !== '' && !suggestions.includes(value);
  const [custom, setCustom] = useState(isCustom);
  return (
    <View style={styles.roleWrap}>
      <View style={styles.chips}>
        {suggestions.map((s) => (
          <SelectChip
            key={s}
            label={s}
            selected={!custom && value === s}
            onPress={() => {
              setCustom(false);
              onChange(s);
            }}
          />
        ))}
        <SelectChip
          label="직접 입력"
          selected={custom}
          onPress={() => {
            setCustom(true);
            if (suggestions.includes(value)) onChange('');
          }}
        />
      </View>
      {custom ? (
        <TextField
          value={value}
          onChangeText={(v) => onChange(v.slice(0, LIMITS.roleLength))}
          placeholder="예: 신랑 아버지"
          maxLength={LIMITS.roleLength}
          autoFocus
        />
      ) : null}
      <Help>{`직접 입력은 ${LIMITS.roleLength}자까지 (예: 신랑 아버지)`}</Help>
    </View>
  );
}

/** Contacts / emails / accounts inside a sheet: tap to edit, × to remove, 꾹 눌러 순서 바꾸기. */
export function ItemRows<T extends { id: string }>({
  items,
  title,
  sub,
  onPress,
  onRemove,
  onReorder,
  onAdd,
  addLabel,
  max,
}: {
  items: T[];
  title: (item: T) => string;
  sub: (item: T) => string;
  onPress: (item: T) => void;
  onRemove: (item: T) => void;
  onReorder: (from: number, to: number) => void;
  onAdd: () => void;
  addLabel: string;
  max: number;
}) {
  const full = items.length >= max;
  const lockScroll = useContext(ScrollLockContext);
  return (
    <View style={styles.listCard}>
      <DragList
        items={items}
        keyOf={(i) => i.id}
        onReorder={onReorder}
        onDragChange={lockScroll}
        renderItem={(item, index, { startDrag, releaseDrag, dragging }) => (
          <Pressable
            onPress={() => onPress(item)}
            onLongPress={startDrag}
            onPressOut={releaseDrag}
            delayLongPress={300}
            style={[styles.itemRow, index > 0 && styles.rowDivider, dragging && styles.itemDragging]}
          >
            <Text style={styles.grip}>⋮⋮</Text>
            <View style={styles.itemText}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {title(item)}
              </Text>
              <Text style={styles.itemSub} numberOfLines={1}>
                {sub(item)}
              </Text>
            </View>
            <Pressable onPress={() => onRemove(item)} hitSlop={10}>
              <Text style={styles.remove}>✕</Text>
            </Pressable>
          </Pressable>
        )}
      />
      <Pressable onPress={onAdd} disabled={full} style={[styles.add, items.length > 0 && styles.rowDivider, full && styles.addOff]}>
        <Text style={styles.addLabel}>{full ? `최대 ${max}개까지 넣을 수 있어요` : `+ ${addLabel}`}</Text>
      </Pressable>
    </View>
  );
}

export function LabeledInput(props: React.ComponentProps<typeof TextField> & { label: string; sub?: string }) {
  const { label, sub, ...rest } = props;
  return (
    <View style={styles.labeled}>
      <Text style={styles.label}>
        {label}
        {sub ? <Text style={styles.labelSub}>{`  ·  ${sub}`}</Text> : null}
      </Text>
      <TextField {...rest} />
    </View>
  );
}

const styles = StyleSheet.create({
  fontCard: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  fontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    paddingHorizontal: space[6],
    paddingVertical: space[5],
    minHeight: 52,
  },
  fontRowOn: {
    backgroundColor: color.accent.tint,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
  },
  fontDefault: {
    flex: 1,
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  fontDefaultSub: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  fontName: {
    flex: 1,
    fontSize: 19,
    color: color.ink.primary,
  },
  fontTag: {
    ...textStyle({ size: 'caption', weight: 'medium', color: color.ink.muted }),
    backgroundColor: color.line.soft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  check: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.accent.base }),
  },
  roleWrap: {
    gap: space[4],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
  },
  listCard: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingHorizontal: space[6],
    paddingVertical: space[5],
    backgroundColor: color.bg.surface,
  },
  itemDragging: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.accent.base,
  },
  grip: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.placeholder }),
    letterSpacing: -2,
  },
  itemText: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }),
  },
  itemSub: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    marginTop: 2,
  },
  remove: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.muted }),
  },
  add: {
    paddingVertical: space[5],
    alignItems: 'center',
  },
  addOff: {
    opacity: 0.6,
  },
  addLabel: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.accent.base }),
  },
  labeled: {
    gap: space[3],
  },
  label: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.label }),
  },
  labelSub: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
});
