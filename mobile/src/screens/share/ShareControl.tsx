import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useLinkChange } from '../../share/useLinkChange';
import { isLinkLocked, shareUrlLabel } from '../../share/link';
import { color, radius, size, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import type { Project, ProjectLink } from '../../types/project';

type Props = {
  project: Project;
  /** 공유를 시작하거나 멈추면 알려줘요 (shared = 바뀐 뒤 상태). */
  onChange: (shared: boolean) => void;
  /** 링크를 바꾸면 알려줘요 (공유 전에만 바꿀 수 있어요). */
  onLinkChange: (link: ProjectLink) => void;
  /** 공유하기 화면은 링크 상자를 따로 그려서 숨겨요. */
  hideLink?: boolean;
};

/**
 * 공유 시작 · 중지 — ⚙ 전체 설정과 관리 › 프로젝트 설정 · 공유하기에서 같이 써요.
 * 처음 시작할 때는 "이 링크로 시작할까요? 시작하면 링크를 바꿀 수 없어요"를 한 번 확인하고,
 * 공유를 중지했다가 다시 시작할 때는 이미 고정된 링크라서 확인 없이 바로 시작해요.
 * 시작 전(또는 중지한 동안)에는 링크를 열면 "초대장 준비중"으로 안내돼요. 응답 · 방명록은 그대로 보관돼요.
 */
export function ShareControl({ project, onChange, onLinkChange, hideLink }: Props) {
  const [stopping, setStopping] = useState(false);
  const [starting, setStarting] = useState(false);
  const linkChange = useLinkChange(project, onLinkChange);
  const started = project.shared;
  const locked = isLinkLocked(project);
  return (
    <View style={styles.box}>
      <View style={styles.head}>
        <View style={[styles.chip, started ? styles.chipOn : styles.chipOff]}>
          <Text style={[styles.chipLabel, started && styles.chipLabelOn]}>{started ? '공유 중' : '공유 전'}</Text>
        </View>
      </View>
      <Text style={styles.desc}>
        {started
          ? '링크를 받은 사람이 초대장을 볼 수 있어요.\n내용을 고치고 싶다면 공유를 잠시 중지하세요.'
          : '공유 시작 후, 링크로 초대장 내용 확인이 가능해요.\n시작 전에는 "초대장 준비중"으로 안내돼요.'}
      </Text>
      {hideLink ? null : (
        <View style={styles.linkBlock}>
          <View style={styles.linkRow}>
            <View style={styles.linkText}>
              <Text style={styles.linkLabel}>초대장 링크</Text>
              <Text style={styles.linkUrl} selectable>
                {shareUrlLabel(project)}
              </Text>
            </View>
            {locked ? (
              <View style={styles.lockChip}>
                <Text style={styles.lockLabel}>고정됨</Text>
              </View>
            ) : (
              <Pressable onPress={linkChange.open} style={styles.changeBtn}>
                <Text style={styles.changeLabel}>링크 변경</Text>
              </Pressable>
            )}
          </View>
          {locked ? <Text style={styles.lockNote}>한 번 공유를 시작한 링크라서 바꿀 수 없어요.</Text> : null}
        </View>
      )}
      {started ? (
        <Pressable onPress={() => setStopping(true)} style={({ pressed }) => [styles.btn, styles.stopBtn, pressed && styles.pressed]}>
          <Text style={styles.stopLabel}>공유 중지하기</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => (locked ? onChange(true) : setStarting(true))}
          style={({ pressed }) => [styles.btn, styles.startBtn, pressed && styles.pressed]}
        >
          <Text style={styles.startLabel}>공유 시작하기</Text>
        </Pressable>
      )}
      <ConfirmDialog
        visible={starting}
        title="이 링크로 공유를 시작할까요?"
        confirmLabel="공유 시작"
        tone="primary"
        onCancel={() => setStarting(false)}
        onConfirm={() => {
          setStarting(false);
          onChange(true);
        }}
      >
        <Text style={styles.dialogLink}>{shareUrlLabel(project)}</Text>
        <Text style={styles.dialogBody}>공유를 시작하면 링크는 수정할 수 없어요.</Text>
      </ConfirmDialog>
      <ConfirmDialog
        visible={stopping}
        title="공유를 중지할까요?"
        confirmLabel="중지하기"
        onCancel={() => setStopping(false)}
        onConfirm={() => {
          setStopping(false);
          onChange(false);
        }}
      >
        <Text style={styles.dialogBody}>{'링크를 열면 "초대장 준비중" 상태로 전환돼요.\n받은 응답과 방명록은 그대로 보관되고,\n언제든 같은 링크로 다시 시작할 수 있어요.'}</Text>
      </ConfirmDialog>
      {linkChange.nodes}
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
  linkBlock: { gap: space[3], borderTopWidth: 1, borderTopColor: color.line.soft, paddingTop: space[5] },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  linkText: { flex: 1 },
  linkLabel: { ...textStyle({ size: 'micro', weight: 'regular', color: color.ink.muted }) },
  linkUrl: { ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }), marginTop: 2 },
  changeBtn: { borderWidth: 1, borderColor: color.line.chip, borderRadius: 8, paddingHorizontal: space[5], paddingVertical: space[3] },
  changeLabel: { ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }) },
  lockChip: { borderWidth: 1, borderColor: color.line.chip, borderRadius: radius.chip, paddingHorizontal: 9, paddingVertical: 3 },
  lockLabel: { ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.muted }) },
  lockNote: { ...textStyle({ size: 'micro', weight: 'regular', color: color.ink.muted }) },
  btn: { borderRadius: radius.button, paddingVertical: size.buttonPaddingY, alignItems: 'center' },
  startBtn: { backgroundColor: color.ink.primary },
  startLabel: { ...textStyle({ size: 'button2', weight: 'semibold', color: color.ink.onPrimary }) },
  stopBtn: { backgroundColor: color.bg.surface, borderWidth: 1, borderColor: color.status.errorBorder },
  stopLabel: { ...textStyle({ size: 'button2', weight: 'semibold', color: color.status.error }) },
  pressed: { opacity: 0.85 },
  dialogLink: { ...textStyle({ size: 'label', weight: 'semibold', color: color.accent.base }), marginBottom: space[3] },
  dialogBody: { ...textStyle({ size: 'body', weight: 'regular', color: color.ink.muted }), lineHeight: 12.5 * 1.7 },
});
