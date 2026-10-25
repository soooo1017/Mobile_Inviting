import { Pressable, Text, View, StyleSheet } from 'react-native';
import { TextField } from '../components/TextField';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { LINK_PHRASE_MAX, LINK_PHRASE_MIN, normalizePhrase, phraseError, SHARE_BASE_URL, type LinkChoice } from './link';

type Props = {
  value: LinkChoice;
  onChange: (next: LinkChoice) => void;
  onFocus?: () => void;
};

const BASE_LABEL = SHARE_BASE_URL.replace(/^https?:\/\//, '');

/**
 * 링크 고르기 — ① 자동으로 만들기(랜덤 8자) ② 원하는 문구로 만들기(영문 소문자 · 숫자 · -, 3~12자 + 랜덤 4자).
 * 새 초대장 6/6과 링크 변경(공유하기 · 프로젝트 설정 · ⚙ 전체 설정)에서 같이 써요.
 */
export function LinkChooser({ value, onChange, onFocus }: Props) {
  const custom = value.mode === 'custom';
  const error = custom ? phraseError(value.phrase) : null;
  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => onChange({ ...value, mode: 'auto' })} style={[styles.option, !custom && styles.optionOn]}>
        <Radio on={!custom} />
        <View style={styles.optionBody}>
          <Text style={styles.optionTitle}>자동으로 만들기</Text>
          <Text style={styles.optionSub}>{`${BASE_LABEL}/${value.auto}`}</Text>
        </View>
      </Pressable>

      <Pressable onPress={() => onChange({ ...value, mode: 'custom' })} style={[styles.option, custom && styles.optionOn]}>
        <Radio on={custom} />
        <View style={styles.optionBody}>
          <Text style={styles.optionTitle}>원하는 문구로 만들기</Text>
          <Text style={styles.optionSub}>{`영문 소문자 · 숫자 · - (${LINK_PHRASE_MIN}~${LINK_PHRASE_MAX}자)`}</Text>
          {custom ? (
            <View style={styles.custom}>
              <TextField
                value={value.phrase}
                onChangeText={(v) => onChange({ ...value, phrase: normalizePhrase(v) })}
                onFocus={onFocus}
                placeholder="예: minseok"
                maxLength={LINK_PHRASE_MAX}
                autoCapitalize="none"
                autoCorrect={false}
                error={!!error}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Text style={styles.example}>
                {`${BASE_LABEL}/${value.phrase || 'minseok'}-`}
                <Text style={styles.rand}>{value.rand}</Text>
              </Text>
              <Text style={styles.note}>문구 뒤에 보안을 위해 랜덤 글자(4자)가 붙어요.</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

/** 선택 칸 — 안쪽 점이 있는 동그라미. */
function Radio({ on }: { on: boolean }) {
  return (
    <View style={[styles.radio, on && styles.radioOn]}>
      {on ? <View style={styles.radioDot} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[4] },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[5],
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.chip,
    borderRadius: radius.card,
    padding: space[6],
  },
  optionOn: { borderColor: color.accent.base, borderWidth: 1.5 },
  optionBody: { flex: 1 },
  optionTitle: { ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }) },
  optionSub: { ...textStyle({ size: 'micro', weight: 'regular', color: color.ink.muted }), marginTop: 3 },
  custom: { marginTop: space[5], gap: space[3] },
  error: { ...textStyle({ size: 'micro', weight: 'regular', color: color.status.error }) },
  example: { ...textStyle({ size: 'small', weight: 'regular', color: color.ink.secondary }) },
  rand: { ...textStyle({ size: 'small', weight: 'semibold', color: color.accent.base }) },
  note: { ...textStyle({ size: 'micro', weight: 'regular', color: color.ink.muted }) },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: color.line.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioOn: { borderColor: color.accent.base },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.accent.base },
});
