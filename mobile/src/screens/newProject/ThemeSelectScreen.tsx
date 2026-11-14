import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useNewProjectDraft } from '../../state/NewProjectDraftContext';
import { WizardHeader } from './WizardHeader';
import { useProjects } from '../../state/ProjectsContext';
import { useStartInvitation } from '../../state/InvitationsContext';
import { linkFromChoice } from '../../share/link';
import { PrimaryButton } from '../../components/PrimaryButton';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { DEFAULT_COLORS, eventTypeMeta, type ThemeColors } from '../../types/project';
import { deriveTheme } from '../../editor/invitationTheme';
import { ThemeColorPicker } from '../../editor/ThemeColorPicker';
import { useFontFamily } from '../../editor/fonts';
import { defaultProjectTitle, formatWhen } from '../../editor/format';
import { FontList } from '../../editor/sheets/common';
import type { FontId } from '../../editor/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ThemeSelect'>;

export function ThemeSelectScreen({ navigation }: Props) {
  const { draft, update } = useNewProjectDraft();

  const typeName = draft.eventType === 'other' ? draft.customTypeName : eventTypeMeta(draft.eventType).label;
  const autoTitle = defaultProjectTitle(draft.eventType, draft.hosts, typeName);
  // 직접 정한 이름이 있으면 그걸, 비워 뒀으면 주인공 이름으로.
  const title = draft.title.trim() || autoTitle;
  const { createProject } = useProjects();
  const startInvitation = useStartInvitation();

  /**
   * 초대장 만들기 — 링크는 자동으로 정해지고(공유 화면에서 공유 전까지 바꿀 수 있어요), 감사페이지는 켜진 채(간단하게 · 7일),
   * 안내 팝업은 꺼진 채 시작해요. 건너뛰면 기본 색 · 글꼴로 만들어요.
   */
  const create = (skipDesign: boolean) => {
    const colors = skipDesign ? DEFAULT_COLORS : draft.colors;
    const font = skipDesign ? 'pretendard' : draft.font;
    const project = createProject({
      title,
      eventType: draft.eventType,
      customTypeName: draft.eventType === 'other' ? draft.customTypeName : undefined,
      hosts: draft.hosts,
      eventAt: draft.eventAt,
      venue: draft.venue,
      thanks: { enabled: true, days: 7, hasContent: false },
      themeId: 'custom',
      colors,
      link: linkFromChoice(draft.link),
    });
    startInvitation(project.id, { font, popup: { enabled: false, startDays: draft.popup.startDays } });
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Editor', params: { projectId: project.id } }] }));
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <WizardHeader onBack={() => navigation.goBack()} step={3} stepLabel="디자인 · 나중에 바꿀 수 있어요" />

      <ScrollView contentContainerStyle={styles.body}>
        <Preview colors={draft.colors} font={draft.font} eyebrow={typeName} title={title || '우리의 초대장'} when={formatWhen(draft.eventAt)} />

        <ThemeColorPicker colors={draft.colors} onChange={(colors) => update({ colors })} />

        <View style={styles.section}>
          <Text style={styles.label}>글꼴</Text>
          <FontList mode="default" value={draft.font} defaultFont={draft.font} onChange={(f) => f && update({ font: f })} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="초대장 만들기" onPress={() => create(false)} />
        <Pressable style={styles.skip} onPress={() => create(true)}>
          <Text style={styles.skipLabel}>건너뛰기 · 기본 디자인으로 시작</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/** Live sample of the picked colors + font, with a 포인트 색 button. */
function Preview({ colors, font, eyebrow, title, when }: { colors: ThemeColors; font: FontId; eyebrow: string; title: string; when: string }) {
  const theme = deriveTheme(colors);
  const regular = useFontFamily(font, false);
  const bold = useFontFamily(font, true);
  return (
    <View style={[styles.preview, { backgroundColor: theme.paper, borderColor: theme.rule }]}>
      <Text style={[styles.previewSmall, { color: theme.inkSoft, fontFamily: regular }]}>{eyebrow}</Text>
      <Text style={[styles.previewTitle, { color: theme.ink, fontFamily: bold }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.previewSmall, { color: theme.inkSoft, fontFamily: regular }]}>{when}</Text>
      <View style={[styles.previewButton, { backgroundColor: theme.accent }]}>
        <Text style={[styles.previewButtonLabel, { color: theme.onAccent, fontFamily: bold }]}>참석 의사 전달하기</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  body: {
    paddingHorizontal: space.screenX,
    paddingBottom: space[8],
    gap: space[8],
  },
  preview: {
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: space[8],
    paddingHorizontal: space[6],
    alignItems: 'center',
    gap: space[3],
  },
  previewSmall: {
    fontSize: 13,
    lineHeight: 19,
  },
  previewTitle: {
    fontSize: 24,
    lineHeight: 32,
  },
  previewButton: {
    marginTop: space[4],
    borderRadius: radius.input,
    paddingHorizontal: space[8],
    paddingVertical: space[4],
  },
  previewButtonLabel: {
    fontSize: 13,
  },
  section: {
    gap: space[4],
  },
  label: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.label }),
  },
  footer: {
    paddingHorizontal: space.screenX,
    paddingVertical: space[6],
    gap: space[3],
  },
  skip: { alignItems: 'center', paddingVertical: space[5], borderWidth: 1, borderColor: color.line.chip, borderRadius: radius.button, backgroundColor: color.bg.surface },
  skipLabel: { ...textStyle({ size: 'control', weight: 'medium', color: color.ink.primary }) },
});
