import { Pressable, Text, View, StyleSheet } from 'react-native';
import { BottomSheet } from '../../components/BottomSheet';
import { color, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import type { DataFormat } from '../../export/guestExport';

type Props = {
  visible: boolean;
  /** "참석 응답 내려받기" · "방명록 내려받기" */
  title: string;
  busy: boolean;
  /** 화면에 남기는 실패 안내(없으면 숨김). */
  error?: string | null;
  onPick: (format: DataFormat) => void;
  onClose: () => void;
};

const OPTIONS: { key: DataFormat; label: string; sub: string }[] = [
  { key: 'xlsx', label: '엑셀 (.xlsx)', sub: '엑셀 · 구글 시트 · 한셀에서 열어요' },
  { key: 'csv', label: 'CSV (.csv)', sub: '메모장이나 다른 프로그램에서 쓸 때' },
];

/** 파일 형식을 고르면 파일을 만들어 폰의 공유창으로 보내요(저장 · 메일 · 메신저 …). 만드는 동안에는 이 창이 열려 있어요. */
export function ExportSheet({ visible, title, busy, error, onPick, onClose }: Props) {
  return (
    <BottomSheet visible={visible} onClose={busy ? () => {} : onClose} title={title}>
      <View style={styles.body}>
        {OPTIONS.map((o) => (
          <Pressable key={o.key} disabled={busy} onPress={() => onPick(o.key)} style={[styles.option, busy && styles.off]}>
            <Text style={styles.label}>{o.label}</Text>
            <Text style={styles.sub}>{o.sub}</Text>
          </Pressable>
        ))}
        {busy ? <Text style={styles.note}>파일을 만드는 중이에요…</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: space.screenX,
    gap: space[3],
  },
  option: {
    paddingVertical: space[5],
    gap: 2,
  },
  off: {
    opacity: 0.45,
  },
  label: {
    ...textStyle({ size: 'body', weight: 'semibold', color: color.ink.primary }),
  },
  sub: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  note: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    textAlign: 'center',
    paddingTop: space[3],
  },
  error: {
    ...textStyle({ size: 'small', weight: 'medium', color: color.status.error }),
    textAlign: 'center',
    paddingTop: space[3],
  },
});
