import { useState } from 'react';
import { Pressable, Share, Text, TextInput, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useProjects } from '../../state/ProjectsContext';
import { useInvitation } from '../../state/InvitationsContext';
import { useSync, type SyncState } from '../../sync/SyncProvider';
import { BottomSheet } from '../../components/BottomSheet';
import { KeyboardAwareForm } from '../../components/KeyboardAwareForm';
import { PrimaryButton } from '../../components/PrimaryButton';
import { DarkToast } from '../../editor/ui';
import { FIXED_TOKENS, insertToken, MESSAGE_MAX, messageValues, personTokens, resolveMessage } from '../../share/message';
import type { Project } from '../../types/project';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { ManageHeader, isShared, manageStyles } from '../manage/common';

type Props = NativeStackScreenProps<RootStackParamList, 'ShareMessage'>;

const SAVE_LABEL: Record<SyncState, string> = { idle: '저장됨', saving: '저장 중…', saved: '저장됨', offline: '오프라인 · 연결되면 저장돼요', error: '저장 실패 · 다시 시도해요' };

/** 메시지 작성하기 — 인사말을 쓰고 {초대장 링크} · {일시} · {장소} · 이름을 끼워 넣어 카카오톡 · 문자 등으로 보내요. 글은 초대장마다 서버에 저장돼요. */
export function ShareMessageScreen({ navigation, route }: Props) {
  const { getProject } = useProjects();
  const project = getProject(route.params.projectId);
  if (!project) return <SafeAreaView style={manageStyles.screen} />;
  return <Body project={project} onBack={() => navigation.goBack()} />;
}

function Body({ project, onBack }: { project: Project; onBack: () => void }) {
  const { invitation, setShareMessage } = useInvitation(project.id);
  const sync = useSync();
  const [text, setText] = useState<string | null>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const value = text ?? invitation?.shareMessage ?? '';
  const values = messageValues(project);
  const resolved = resolveMessage(value, values);
  const started = isShared(project);
  const canSend = started && value.trim().length > 0;

  const change = (next: string) => {
    setText(next);
    setShareMessage(next);
  };
  const insert = (token: string) => {
    const res = insertToken(value, selection, token);
    if (!res) {
      setToast('글자 수를 넘어서 넣을 수 없어요');
      return;
    }
    change(res.text);
    setSelection({ start: res.cursor, end: res.cursor });
  };
  // 폰의 공유창이 열려요 — 카카오톡 · 문자 · 복사 등을 골라요.
  const send = () => {
    if (!canSend) return;
    Share.share({ message: resolved }).catch(() => setToast('공유창을 열지 못했어요'));
  };

  return (
    <SafeAreaView style={manageStyles.screen} edges={['top', 'bottom']}>
      <ManageHeader
        title="메시지 작성하기"
        onBack={onBack}
        right={
          <Pressable onPress={() => setHelpOpen(true)} style={styles.helpBtn} hitSlop={8} accessibilityLabel="도움말">
            <Text style={styles.helpLabel}>?</Text>
          </Pressable>
        }
      />
      <KeyboardAwareForm
        contentContainerStyle={[manageStyles.body, styles.body]}
        footer={
          <View style={styles.footer}>
            <PrimaryButton label="메시지 보내기" onPress={send} disabled={!canSend} />
          </View>
        }
      >
        <View style={styles.block}>
          <Text style={styles.label}>
            넣을 정보 <Text style={styles.sub}>누르면 글 속 커서 자리에 들어가요</Text>
          </Text>
          <View style={styles.chips}>
            {FIXED_TOKENS.map((t) => (
              <Pressable key={t} onPress={() => insert(t)} style={[styles.chip, t === '초대장 링크' && styles.chipLink]}>
                <Text style={[styles.chipLabel, t === '초대장 링크' && styles.chipLabelLink]}>{`{ ${t} }`}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setPeopleOpen(true)} style={[styles.chip, styles.chipMenu]}>
              <Text style={styles.chipMenuLabel}>이름 ▾</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.block}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>메시지</Text>
            <Text style={styles.sub}>{`${SAVE_LABEL[sync.state]} · ${value.length} / ${MESSAGE_MAX}`}</Text>
          </View>
          <View style={styles.inputWrap}>
            <TextInput
              value={value}
              onChangeText={change}
              selection={selection}
              onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
              multiline
              maxLength={MESSAGE_MAX}
              placeholder="받는 분께 전할 인사말을 적고, 위 버튼으로 초대장 정보를 넣어 보세요."
              placeholderTextColor={color.ink.placeholder}
              selectionColor={color.accent.base}
              textAlignVertical="top"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>
            보낼 모습 <Text style={styles.sub}>정보는 실제 값으로 바뀌어요</Text>
          </Text>
          <View style={styles.preview}>
            <Text style={[styles.previewText, !value.trim() && styles.previewEmpty]}>{value.trim() ? resolved : '여기에 보낼 모습이 보여요.'}</Text>
          </View>
        </View>

        {started ? null : (
          <View style={styles.band}>
            <Text style={styles.bandText}>아직 공유 전이라 링크가 열리지 않아요. 글은 미리 써 둘 수 있고, 보내기는 공유를 시작한 뒤에 켜져요.</Text>
          </View>
        )}
      </KeyboardAwareForm>

      <BottomSheet visible={peopleOpen} onClose={() => setPeopleOpen(false)} title="넣을 이름 고르기">
        <View style={styles.sheetBody}>
          {personTokens(project).map((t) => (
            <Pressable
              key={t}
              style={styles.personRow}
              onPress={() => {
                setPeopleOpen(false);
                insert(t);
              }}
            >
              <Text style={styles.personToken}>{`{${t}}`}</Text>
              <Text style={styles.personValue} numberOfLines={1}>{values[t]}</Text>
            </Pressable>
          ))}
          <Text style={styles.help}>초대장에 적은 이름이 바뀌면 보낼 때 바뀐 이름이 들어가요.</Text>
        </View>
      </BottomSheet>

      <BottomSheet visible={helpOpen} onClose={() => setHelpOpen(false)} title="메시지 작성 도움말" maxHeight="85%">
        <View style={styles.sheetBody}>
          <HelpItem title="1. 정보 넣기" body={'위쪽 버튼([이름 ▾]에서는 이름)을 누르면 글 속 커서 자리에 {초대장 링크}처럼 중괄호 표시가 들어가요. 문자 보낼 때 이름이나 날짜를 끼워 넣는 “머지 문자”와 같은 방식이에요.'} />
          <HelpItem title="2. 보낼 때 바뀌어요" body="[메시지 보내기]를 누르면 중괄호 표시가 이 초대장의 실제 값으로 바뀐 글이 만들어져요. 아래 “보낼 모습”으로 미리 볼 수 있어요." />
          <HelpItem title="3. 고치면 따라 바뀌어요" body="초대장 이름 · 일시 · 장소 · 이름을 고치면, 다음에 보낼 때 바뀐 값이 들어가요. 링크를 바꿔도 마찬가지예요." />
          <HelpItem title="4. 직접 적어도 돼요" body={'버튼 없이 {일시}처럼 같은 이름으로 직접 적어도 바뀌어요. 이름이 다르면 그대로 남으니 철자를 확인하세요.'} />
          <HelpItem title="5. 보내기" body="[메시지 보내기]를 누르면 폰의 공유창이 열려요. 카카오톡 · 문자 등을 고르거나, “복사”를 골라 다른 곳에 붙여넣어도 돼요. 글에 초대장 링크가 들어 있으면 카카오톡이 사진 · 제목 카드도 같이 보여줘요." />
        </View>
      </BottomSheet>

      <DarkToast message={toast} onHide={() => setToast(null)} bottom={90} />
    </SafeAreaView>
  );
}

function HelpItem({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.helpItem}>
      <Text style={styles.helpTitle}>{title}</Text>
      <Text style={styles.helpBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[7] },
  block: { gap: space[4] },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.label }) },
  sub: { ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  chip: { borderWidth: 1, borderColor: color.line.chip, borderRadius: radius.pill, backgroundColor: color.bg.surface, paddingHorizontal: 13, paddingVertical: 8 },
  chipLink: { borderColor: color.accent.base, backgroundColor: color.accent.tintSoft },
  chipLabel: { ...textStyle({ size: 'label', weight: 'medium', color: color.ink.primary }) },
  chipLabelLink: { color: color.accent.base },
  chipMenu: { borderStyle: 'dashed', borderColor: color.accent.base },
  chipMenuLabel: { ...textStyle({ size: 'label', weight: 'medium', color: color.accent.base }) },
  inputWrap: { backgroundColor: color.bg.surface, borderWidth: 1, borderColor: color.line.default, borderRadius: radius.input, padding: space[5] },
  input: { minHeight: 170, padding: 0, ...textStyle({ size: 'control', weight: 'regular', color: color.ink.primary }), lineHeight: 16 * 1.5 },
  preview: { backgroundColor: color.bg.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: color.line.dashed, borderRadius: radius.card, padding: space[6], minHeight: 70 },
  previewText: { ...textStyle({ size: 'label', weight: 'regular', color: color.ink.primary }), lineHeight: 14 * 1.7 },
  previewEmpty: { color: color.ink.muted },
  band: { backgroundColor: color.accent.tintSoft, borderRadius: radius.input, padding: space[5] },
  bandText: { ...textStyle({ size: 'small', weight: 'regular', color: color.ink.primary }), lineHeight: 12 * 1.6 },
  footer: { paddingHorizontal: space.screenX, paddingBottom: space[9], paddingTop: space[6] },
  helpBtn: { marginLeft: 'auto', width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: color.accent.base, alignItems: 'center', justifyContent: 'center' },
  helpLabel: { ...textStyle({ size: 'label', weight: 'semibold', color: color.accent.base }) },
  sheetBody: { paddingHorizontal: space.screenX, paddingBottom: space[6], gap: space[5] },
  personRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[4], paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: color.line.soft },
  personToken: { ...textStyle({ size: 'label', weight: 'medium', color: color.ink.primary }) },
  personValue: { flexShrink: 1, ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }) },
  help: { ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }) },
  helpItem: { gap: space[1] },
  helpTitle: { ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }) },
  helpBody: { ...textStyle({ size: 'label', weight: 'regular', color: color.ink.secondary }), lineHeight: 14 * 1.6 },
});
