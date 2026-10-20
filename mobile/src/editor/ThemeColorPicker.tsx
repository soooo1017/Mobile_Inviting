import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { ColorPicker } from '../components/ColorPicker';
import { TextField } from '../components/TextField';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { COLOR_COMBOS, type TextColorChoice, type ThemeColors } from '../types/project';
import { autoTextColor, contrast, MIN_TEXT_CONTRAST, normalizeHex } from './colors';
import { resolveTextColor } from './invitationTheme';
import { Help, Section } from './ui';

type Target = 'bg' | 'accent' | 'text';
const TARGET_TITLE: Record<Target, string> = { bg: '배경 색', accent: '포인트 색', text: '글씨 색' };

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const comboIndex = (c: ThemeColors) => COLOR_COMBOS.findIndex(([x, y]) => (same(c.bg, x) && same(c.accent, y)) || (same(c.bg, y) && same(c.accent, x)));

/**
 * 배경 · 포인트 색 + 글씨 색. Five 색 조합 (two colors each — which one is 배경 and which 포인트 is up to
 * the user, ⇄ swaps them) and 직접 (pick each). Shared by new-project step 4 and the editor's ⚙ 전체 설정.
 */
export function ThemeColorPicker({ colors, onChange }: { colors: ThemeColors; onChange: (colors: ThemeColors) => void }) {
  const [custom, setCustom] = useState(() => comboIndex(colors) < 0);
  const [target, setTarget] = useState<Target | null>(null);
  const selected = custom ? -1 : comboIndex(colors);
  const textColor = resolveTextColor(colors.text, colors.accent, colors.bg);
  const defaultLabel = autoTextColor(colors.bg) === '#ffffff' ? '흰색 (기본)' : '검정 (기본)';
  const hard = contrast(colors.bg, textColor) < MIN_TEXT_CONTRAST;
  const customText = colors.text.startsWith('#');

  const pickCombo = (i: number) => {
    setCustom(false);
    if (i !== selected) onChange({ ...colors, bg: COLOR_COMBOS[i][0], accent: COLOR_COMBOS[i][1] });
  };
  const setColor = (t: Target, hex: string) => {
    if (t === 'text') onChange({ ...colors, text: hex as TextColorChoice });
    else onChange({ ...colors, [t]: hex });
  };

  const targetValue = target === 'text' ? textColor : target ? colors[target] : '#000000';

  const textChips: { key: TextColorChoice | 'custom'; label: string; dot?: string; on: boolean; onPress: () => void }[] = [
    { key: 'black', label: defaultLabel, dot: resolveTextColor('black', colors.accent, colors.bg), on: colors.text === 'black', onPress: () => onChange({ ...colors, text: 'black' }) },
    { key: 'gray', label: '진한 회색', dot: resolveTextColor('gray', colors.accent, colors.bg), on: colors.text === 'gray', onPress: () => onChange({ ...colors, text: 'gray' }) },
    { key: 'accent', label: '포인트 색', dot: colors.accent, on: colors.text === 'accent', onPress: () => onChange({ ...colors, text: 'accent' }) },
    { key: 'custom', label: '직접', dot: customText ? textColor : undefined, on: customText, onPress: () => setTarget('text') },
  ];

  return (
    <>
      <Section label="배경 · 포인트 색">
        <View style={styles.combos}>
          {COLOR_COMBOS.map(([a, b], i) => (
            <Pressable key={a + b} onPress={() => pickCombo(i)} style={[styles.combo, i === selected && styles.comboOn]} accessibilityState={{ selected: i === selected }}>
              <View style={[styles.half, { backgroundColor: a }]} />
              <View style={[styles.half, { backgroundColor: b }]} />
            </Pressable>
          ))}
          <Pressable onPress={() => setCustom(true)} style={[styles.combo, styles.comboCustom, custom && styles.comboOn]} accessibilityState={{ selected: custom }}>
            <Text style={styles.plus}>＋</Text>
            <Text style={styles.customLabel}>직접</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          <Role label="배경" hex={colors.bg} editable={custom} onPress={() => setTarget('bg')} />
          <Role label="포인트" hex={colors.accent} editable={custom} onPress={() => setTarget('accent')} divider />
          {custom ? null : (
            <Pressable onPress={() => onChange({ ...colors, bg: colors.accent, accent: colors.bg })} style={[styles.swap, styles.divider]}>
              <Text style={styles.swapLabel}>⇄ 배경 · 포인트 바꾸기</Text>
            </Pressable>
          )}
        </View>
      </Section>

      <Section label="글씨 색">
        <View style={styles.chips}>
          {textChips.map((c) => (
            <Pressable key={c.key} onPress={c.onPress} style={[styles.chip, c.on && styles.chipOn]}>
              {c.dot ? <View style={[styles.dot, { backgroundColor: c.dot }, c.on && styles.dotOn]} /> : null}
              <Text style={[styles.chipLabel, c.on && styles.chipLabelOn]}>{c.label}</Text>
            </Pressable>
          ))}
        </View>
        {hard ? (
          <View style={styles.warn}>
            <Text style={styles.warnText}>배경과 글씨 색이 비슷해서 잘 안 보일 수 있어요.</Text>
          </View>
        ) : null}
      </Section>

      <ColorSheet
        visible={target !== null}
        title={target ? TARGET_TITLE[target] : ''}
        value={targetValue}
        onChange={(hex) => target && setColor(target, hex)}
        onClose={() => setTarget(null)}
      />
    </>
  );
}

function Role({ label, hex, editable, onPress, divider }: { label: string; hex: string; editable: boolean; onPress: () => void; divider?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!editable} style={[styles.role, divider && styles.divider]}>
      <View style={[styles.swatch, { backgroundColor: hex }]} />
      <Text style={styles.roleLabel}>{label}</Text>
      <Text style={styles.roleValue}>{`${hex.toUpperCase()}${editable ? ' ›' : ''}`}</Text>
    </Pressable>
  );
}

/** 색 고르기 창: 색상 영역 + 밝기 바 + 색 코드. */
function ColorSheet({ visible, title, value, onChange, onClose }: { visible: boolean; title: string; value: string; onChange: (hex: string) => void; onClose: () => void }) {
  const [text, setText] = useState(value.toUpperCase());
  const [wasVisible, setWasVisible] = useState(visible);
  const [lastValue, setLastValue] = useState(value);

  // Reopening shows the color being edited; picking in the area/bar updates the code field.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setText(value.toUpperCase());
  }
  if (value !== lastValue) {
    setLastValue(value);
    if (!normalizeHex(text) || !same(normalizeHex(text) ?? '', value)) setText(value.toUpperCase());
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.sheet}>
        <ColorPicker value={value} onChange={onChange} />
        <View style={styles.codeWrap}>
          <Text style={styles.codeLabel}>색 코드</Text>
          <TextField
            value={text}
            onChangeText={(t) => {
              setText(t);
              const hex = normalizeHex(t);
              if (hex) onChange(hex);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={7}
            error={!!text && !normalizeHex(text)}
          />
        </View>
        <Help>색상 영역을 누르거나 끌어서 고르고, 아래 바로 밝기를 바꿔요.</Help>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  combos: {
    flexDirection: 'row',
    gap: space[3],
  },
  combo: {
    flex: 1,
    aspectRatio: 1,
    flexDirection: 'row',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.line.default,
    overflow: 'hidden',
  },
  half: {
    flex: 1,
  },
  comboOn: {
    borderWidth: 2,
    borderColor: color.select.fill,
  },
  comboCustom: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderColor: color.line.dashed,
    backgroundColor: color.bg.surface,
  },
  plus: {
    ...textStyle({ size: 'title3', weight: 'regular', color: color.ink.muted }),
  },
  customLabel: {
    ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.muted }),
  },
  card: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
  },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingHorizontal: space[6],
    paddingVertical: space[5],
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: color.line.default,
  },
  roleLabel: {
    flex: 1,
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.primary }),
  },
  roleValue: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    fontVariant: ['tabular-nums'],
  },
  swap: {
    paddingVertical: space[5],
    alignItems: 'center',
  },
  swapLabel: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.accent.base }),
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    borderWidth: 1,
    borderColor: color.line.chip,
    backgroundColor: color.bg.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipOn: {
    backgroundColor: color.select.fill,
    borderColor: color.select.fill,
  },
  chipLabel: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.primary }),
  },
  chipLabelOn: {
    color: color.select.on,
    fontFamily: 'Pretendard-SemiBold',
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  dotOn: {
    borderColor: 'rgba(255,255,255,0.7)',
  },
  warn: {
    backgroundColor: color.status.errorTint,
    borderWidth: 1,
    borderColor: color.status.errorBorder,
    borderRadius: radius.input,
    paddingHorizontal: space[5],
    paddingVertical: space[4],
  },
  warnText: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.status.error }),
  },
  sheet: {
    paddingHorizontal: space.screenX,
    paddingBottom: space[6],
    gap: space[6],
  },
  codeWrap: {
    gap: space[3],
  },
  codeLabel: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.label }),
  },
});
