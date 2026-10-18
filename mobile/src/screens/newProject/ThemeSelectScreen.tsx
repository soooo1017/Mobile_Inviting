import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useNewProjectDraft } from '../../state/NewProjectDraftContext';
import { useProjects } from '../../state/ProjectsContext';
import { useStartInvitation } from '../../state/InvitationsContext';
import { BackButton } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { THEMES, eventTypeMeta } from '../../types/project';
import { invitationTheme } from '../../editor/invitationTheme';
import { useFontFamily } from '../../editor/fonts';
import { formatWhen } from '../../editor/format';
import { FontList } from '../../editor/sheets/common';
import type { FontId } from '../../editor/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ThemeSelect'>;

export function ThemeSelectScreen({ navigation }: Props) {
  const { draft, update } = useNewProjectDraft();
  const { createProject } = useProjects();
  const startInvitation = useStartInvitation();

  const typeName = draft.eventType === 'other' ? draft.customTypeName : eventTypeMeta(draft.eventType).label;
  const title = draft.hosts.map((h) => h.name).filter(Boolean).join(' · ') || typeName;

  const handleStart = () => {
    const project = createProject({
      title,
      eventType: draft.eventType,
      customTypeName: draft.eventType === 'other' ? draft.customTypeName : undefined,
      hosts: draft.hosts,
      eventAt: draft.eventAt,
      venue: draft.venue,
      thanks: draft.thanks,
      themeId: draft.themeId,
    });
    // 처음 열면 빈 페이지 (추천 구성은 출시 뒤) — only the chosen 기본 글꼴 is set up.
    startInvitation(project.id, { font: draft.font });
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Editor', params: { projectId: project.id } }] }),
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>테마 · 글꼴</Text>
      </View>
      <Text style={styles.stepLabel}>4 / 4 · 나중에 바꿀 수 있어요</Text>

      <ScrollView contentContainerStyle={styles.body}>
        <Preview themeId={draft.themeId} font={draft.font} eyebrow={typeName} title={title || '우리의 초대장'} when={formatWhen(draft.eventAt)} />

        <View style={styles.section}>
          <Text style={styles.label}>배경 테마</Text>
          <View style={styles.swatches}>
            {THEMES.map((theme) => {
              const selected = draft.themeId === theme.id;
              return (
                <Pressable key={theme.id} style={styles.swatchCell} onPress={() => update({ themeId: theme.id })}>
                  <View style={[styles.swatch, { backgroundColor: theme.colors[0] }, selected && styles.swatchOn]}>
                    <View style={[styles.swatchDot, { backgroundColor: theme.colors[1] }]} />
                  </View>
                  <Text style={[styles.swatchName, selected && styles.swatchNameOn]}>{theme.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>글꼴</Text>
          <FontList mode="default" value={draft.font} defaultFont={draft.font} onChange={(f) => f && update({ font: f })} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="제작 시작하기" onPress={handleStart} />
      </View>
    </SafeAreaView>
  );
}

/** Live sample of the picked theme + font. */
function Preview({ themeId, font, eyebrow, title, when }: { themeId: string; font: FontId; eyebrow: string; title: string; when: string }) {
  const theme = invitationTheme(themeId);
  const regular = useFontFamily(font, false);
  const bold = useFontFamily(font, true);
  return (
    <View style={[styles.preview, { backgroundColor: theme.paper, borderColor: theme.rule }]}>
      <Text style={[styles.previewSmall, { color: theme.inkSoft, fontFamily: regular }]}>{eyebrow}</Text>
      <Text style={[styles.previewTitle, { color: theme.ink, fontFamily: bold }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.previewSmall, { color: theme.inkSoft, fontFamily: regular }]}>{when}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingHorizontal: space.screenX,
  },
  headerTitle: {
    ...textStyle({ size: 'title2', weight: 'semibold', color: color.ink.primary }),
    marginTop: space[7],
  },
  stepLabel: {
    ...textStyle({ size: 'micro', weight: 'medium', color: color.accent.base }),
    marginTop: space[4],
    marginLeft: space.screenX,
    marginBottom: space[6],
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
  section: {
    gap: space[4],
  },
  label: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.label }),
  },
  swatches: {
    flexDirection: 'row',
    gap: space[3],
  },
  swatchCell: {
    flex: 1,
    alignItems: 'center',
    gap: space[2],
  },
  swatch: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.line.default,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 5,
  },
  swatchOn: {
    borderWidth: 2,
    borderColor: color.select.fill,
  },
  swatchDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  swatchName: {
    ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.secondary }),
  },
  swatchNameOn: {
    color: color.select.fill,
    fontFamily: 'Pretendard-SemiBold',
  },
  footer: {
    paddingHorizontal: space.screenX,
    paddingVertical: space[6],
  },
});
