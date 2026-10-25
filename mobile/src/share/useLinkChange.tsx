import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PrimaryButton } from '../components/PrimaryButton';
import { hasPosterDesign } from '../poster/storage';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import type { Project, ProjectLink } from '../types/project';
import { LinkChooser } from './LinkChooser';
import { choiceFromProject, choiceReady, linkFromChoice, type LinkChoice } from './link';

/**
 * 링크 변경 — 공유를 시작하기 전까지만. 공유하기 · 프로젝트 설정 · ⚙ 전체 설정에서 같이 써요.
 * `open()`으로 시트를 열고, `nodes`를 화면 맨 아래에 그려 두면 돼요 (시트 + 완료 뒤 QR 안내).
 * 완료하면 QR 코드도 새 링크로 바뀌어서, 홍보물을 만들어 둔 초대장이면 "다시 저장해주세요" 안내를 한 번 더 보여줘요.
 */
export function useLinkChange(project: Project, onSave: (link: ProjectLink) => void) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [choice, setChoice] = useState<LinkChoice>(() => choiceFromProject(project));
  const [notice, setNotice] = useState(false);

  const open = () => {
    setChoice(choiceFromProject(project));
    setVisible(true);
  };

  const save = async () => {
    if (!choiceReady(choice)) return;
    onSave(linkFromChoice(choice));
    setVisible(false);
    if (await hasPosterDesign(project.id)) setNotice(true);
  };

  const nodes = (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.overlay} onPress={() => setVisible(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space[7]) }]}>
            <View style={styles.grabber} />
            <View style={styles.header}>
              <Text style={styles.title}>링크 변경</Text>
              <Pressable onPress={() => setVisible(false)} hitSlop={10}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
              <LinkChooser value={choice} onChange={setChoice} />
              <View style={styles.warn}>
                <Text style={styles.warnText}>{'링크를 바꾸면 QR 코드도 새 링크로 바뀌어요.\n만들어 둔 홍보물이 있다면 다시 저장해주세요.'}</Text>
              </View>
              <PrimaryButton label="완료" onPress={save} disabled={!choiceReady(choice)} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <ConfirmDialog
        visible={notice}
        title="QR 코드가 새 링크로 바뀌었어요"
        confirmLabel="확인"
        tone="primary"
        hideCancel
        onCancel={() => setNotice(false)}
        onConfirm={() => setNotice(false)}
      >
        <Text style={styles.noticeBody}>{'이미 저장하거나 보낸 QR · 홍보물 이미지는 예전 링크예요.\n홍보물을 다시 저장해주세요.'}</Text>
      </ConfirmDialog>
    </>
  );

  return { open, nodes };
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: color.overlay.sheet },
  sheet: {
    backgroundColor: color.bg.sheet,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    maxHeight: '90%',
  },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: color.line.chip, marginTop: space[3], marginBottom: space[5] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.screenX, marginBottom: space[5] },
  title: { ...textStyle({ size: 'title3', weight: 'semibold', color: color.ink.primary }) },
  close: { ...textStyle({ size: 'control', weight: 'regular', color: color.ink.muted }) },
  body: { paddingHorizontal: space.screenX, gap: space[6] },
  warn: { backgroundColor: color.status.errorTint, borderWidth: 1, borderColor: color.status.errorBorder, borderRadius: radius.input, paddingHorizontal: space[5], paddingVertical: space[5] },
  warnText: { ...textStyle({ size: 'label', weight: 'semibold', color: color.status.error }), lineHeight: 14 * 1.55 },
  noticeBody: { ...textStyle({ size: 'body', weight: 'regular', color: color.ink.muted }), lineHeight: 12.5 * 1.7 },
});
