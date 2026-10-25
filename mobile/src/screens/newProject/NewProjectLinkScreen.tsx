import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useNewProjectDraft } from '../../state/NewProjectDraftContext';
import { useProjects } from '../../state/ProjectsContext';
import { useStartInvitation } from '../../state/InvitationsContext';
import { WizardHeader } from './WizardHeader';
import { KeyboardAwareForm, useKeyboardAwareForm } from '../../components/KeyboardAwareForm';
import { PrimaryButton } from '../../components/PrimaryButton';
import { LinkChooser } from '../../share/LinkChooser';
import { choiceReady, linkFromChoice } from '../../share/link';
import { color, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { eventTypeMeta } from '../../types/project';
import { defaultProjectTitle } from '../../editor/format';

type Props = NativeStackScreenProps<RootStackParamList, 'NewProjectLink'>;

/** 6/6 — 공유 링크를 자동으로 만들지, 원하는 문구로 만들지 정해요. 공유를 시작하기 전까지는 바꿀 수 있어요. */
export function NewProjectLinkScreen({ navigation }: Props) {
  const { draft, update } = useNewProjectDraft();
  const { createProject } = useProjects();
  const startInvitation = useStartInvitation();
  const { scrollRef, fieldLayout, onFieldFocus } = useKeyboardAwareForm();

  const typeName = draft.eventType === 'other' ? draft.customTypeName : eventTypeMeta(draft.eventType).label;
  const title = defaultProjectTitle(draft.eventType, draft.hosts, typeName);
  const ready = choiceReady(draft.link);

  const handleStart = () => {
    if (!ready) return;
    const project = createProject({
      title,
      eventType: draft.eventType,
      customTypeName: draft.eventType === 'other' ? draft.customTypeName : undefined,
      hosts: draft.hosts,
      eventAt: draft.eventAt,
      venue: draft.venue,
      thanks: draft.thanks,
      themeId: 'custom',
      colors: draft.colors,
      link: linkFromChoice(draft.link),
    });
    // 처음 열면 빈 페이지 (추천 구성은 출시 뒤) — only the chosen 기본 글꼴 · 안내 팝업이 설정돼요.
    startInvitation(project.id, { font: draft.font, popup: { enabled: draft.popup.enabled, startDays: draft.popup.startDays } });
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Editor', params: { projectId: project.id } }] }),
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <WizardHeader onBack={() => navigation.goBack()} step={6} stepLabel="공유 링크" />
      <KeyboardAwareForm
        scrollRef={scrollRef}
        contentContainerStyle={styles.content}
        footer={
          <View style={styles.footer}>
            <PrimaryButton label="제작 시작하기" onPress={handleStart} disabled={!ready} />
          </View>
        }
      >
        <Text style={styles.title}>{'초대장 링크를\n어떻게 만들까요?'}</Text>
        <Text style={styles.desc}>{'링크는 공유를 시작하기 전까지 바꿀 수 있어요.\n공유를 시작하면 고정돼요.'}</Text>
        <View style={styles.body} onLayout={fieldLayout('link')}>
          <LinkChooser value={draft.link} onChange={(link) => update({ link })} onFocus={() => onFieldFocus('link')} />
        </View>
      </KeyboardAwareForm>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg.canvas },
  content: { paddingHorizontal: space.screenX, paddingTop: space[8], paddingBottom: space[8] },
  title: { ...textStyle({ size: 'step', weight: 'semibold', lineHeight: 'heading', color: color.ink.primary }) },
  desc: { ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }), lineHeight: 11.5 * 1.5, marginTop: space[4] },
  body: { marginTop: space[8] },
  footer: { paddingHorizontal: space.screenX, paddingBottom: space[9], paddingTop: space[6] },
});
