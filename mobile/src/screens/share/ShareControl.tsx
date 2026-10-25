import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { color, radius, size, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import type { Project } from '../../types/project';

type Props = {
  project: Project;
  /** 공유를 시작하거나 멈추면 알려줘요 (shared = 바뀐 뒤 상태). */
  onChange: (shared: boolean) => void;
};

/**
 * 공유 시작 · 중지 — ⚙ 전체 설정과 관리 › 프로젝트 설정에서 같이 써요.
 * 시작하기 전(또는 중지한 동안)에는 링크를 열면 "초대장 준비 중"으로 안내돼요. 응답 · 방명록은 그대로 보관돼요.
 */
export function ShareControl({ project, onChange }: Props) {
  const [confirming, setConfirming] = useState(false);
  const started = project.shared;
  return (
    <View style={styles.box}>
      <View style={styles.head}>
        <View style={[styles.chip, started ? styles.chipOn : styles.chipOff]}>
          <Text style={[styles.chipLabel, started && styles.chipLabelOn]}>{started ? '공유 중' : '공유 전'}</Text>
        </View>
      </View>
      <Text style={styles.desc}>
        {started
          ? '링크를 받은 사람이 초대장을 볼 수 있어요. 내용을 고치고 싶다면 공유를 잠시 중지할 수 있어요.'
          : '공유를 시작해야 공유 링크로 초대장 내용을 확인할 수 있어요. 시작 전에는 초대장 준비중으로 안내돼요.'}
      </Text>
      {started ? (
        <Pressable onPress={() => setConfirming(true)} style={({ pressed }) => [styles.btn, styles.stopBtn, pressed && styles.pressed]}>
          <Text style={styles.stopLabel}>공유 중지하기</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => onChange(true)} style={({ pressed }) => [styles.btn, styles.startBtn, pressed && styles.pressed]}>
          <Text style={styles.startLabel}>공유 시작하기</Text>
        </Pressable>
      )}
      <ConfirmDialog
        visible={confirming}
        title="공유를 중지할까요?"
        confirmLabel="중지하기"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onChange(false);
        }}
      >
        <Text style={styles.dialogBody}>{'중지하는 동안 링크를 열면 "초대장 준비 중"으로 안내돼요.\n받은 응답과 방명록은 그대로 보관되고, 언제든 다시 시작할 수 있어요.'}</Text>
      </ConfirmDialog>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    padding: space[6],
    gap: space[5],
  },
  head: { flexDirection: 'row' },
  chip: { borderRadius: radius.chip, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  chipOff: { backgroundColor: color.bg.surface, borderColor: color.line.chip },
  chipOn: { backgroundColor: color.accent.tintSoft, borderColor: color.accent.tintBorder },
  chipLabel: { ...textStyle({ size: 'caption', weight: 'medium', color: color.ink.secondary }) },
  chipLabelOn: { color: color.accent.base },
  desc: { ...textStyle({ size: 'label', weight: 'regular', color: color.ink.secondary }), lineHeight: 14 * 1.6 },
  btn: { borderRadius: radius.button, paddingVertical: size.buttonPaddingY, alignItems: 'center' },
  startBtn: { backgroundColor: color.ink.primary },
  startLabel: { ...textStyle({ size: 'button2', weight: 'semibold', color: color.ink.onPrimary }) },
  stopBtn: { backgroundColor: color.bg.surface, borderWidth: 1, borderColor: color.status.errorBorder },
  stopLabel: { ...textStyle({ size: 'button2', weight: 'semibold', color: color.status.error }) },
  pressed: { opacity: 0.85 },
  dialogBody: { ...textStyle({ size: 'body', weight: 'regular', color: color.ink.muted }), lineHeight: 12.5 * 1.7 },
});
