import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useNewProjectDraft } from '../../state/NewProjectDraftContext';
import { useProjects } from '../../state/ProjectsContext';
import { BackButton } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { THEMES, eventTypeMeta } from '../../types/project';
import { ProjectThumb } from '../projectList/ProjectThumb';

type Props = NativeStackScreenProps<RootStackParamList, 'ThemeSelect'>;

export function ThemeSelectScreen({ navigation }: Props) {
  const { draft, update } = useNewProjectDraft();
  const { createProject } = useProjects();

  const title = draft.hosts.map((h) => h.name).filter(Boolean).join(' · ')
    || (draft.eventType === 'other' ? draft.customTypeName : eventTypeMeta(draft.eventType).label);

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
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'EditorPlaceholder', params: { projectId: project.id } }] }),
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>테마 선택</Text>
      </View>
      <Text style={styles.stepLabel}>4 / 4 · 나중에 바꿀 수 있어요</Text>

      <ScrollView contentContainerStyle={styles.grid}>
        {THEMES.map((theme) => {
          const selected = draft.themeId === theme.id;
          return (
            <Pressable key={theme.id} style={styles.cell} onPress={() => update({ themeId: theme.id })}>
              <View style={[styles.card, selected && styles.cardSelected]}>
                <ProjectThumb themeId={theme.id} style={styles.thumb} />
                <Text style={styles.cardTitle}>{title || 'Jiwon & Minseok'}</Text>
                <View style={styles.cardUnderline} />
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.themeName}>{theme.name}</Text>
                {selected ? <Text style={styles.selectedLabel}>선택됨</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="제작 시작하기" onPress={handleStart} />
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: space.screenX,
    gap: space[6],
  },
  cell: {
    width: '46%',
  },
  card: {
    backgroundColor: color.bg.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: radius.card,
    padding: space[5],
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: color.ink.primary,
  },
  thumb: {
    width: 72,
    height: 96,
    borderRadius: 4,
  },
  cardTitle: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.secondary }),
    marginTop: space[5],
  },
  cardUnderline: {
    width: 40,
    height: 1,
    backgroundColor: color.line.default,
    marginTop: space[2],
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space[3],
  },
  themeName: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }),
  },
  selectedLabel: {
    ...textStyle({ size: 'small', weight: 'medium', color: color.accent.base }),
  },
  footer: {
    paddingHorizontal: space.screenX,
    paddingVertical: space[6],
  },
});
