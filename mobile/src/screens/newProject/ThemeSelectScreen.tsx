import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useNewProjectDraft } from '../../state/NewProjectDraftContext';
import { BackButton } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { eventTypeMeta, type ThemeColors } from '../../types/project';
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
  const title = defaultProjectTitle(draft.eventType, draft.hosts, typeName);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>테마 · 글꼴</Text>
      </View>
      <Text style={styles.stepLabel}>5 / 6 · 나중에 바꿀 수 있어요</Text>

      <ScrollView contentContainerStyle={styles.body}>
        <Preview colors={draft.colors} font={draft.font} eyebrow={typeName} title={title || '우리의 초대장'} when={formatWhen(draft.eventAt)} />

        <ThemeColorPicker colors={draft.colors} onChange={(colors) => update({ colors })} />

        <View style={styles.section}>
          <Text style={styles.label}>글꼴</Text>
          <FontList mode="default" value={draft.font} defaultFont={draft.font} onChange={(f) => f && update({ font: f })} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="다음" onPress={() => navigation.navigate('NewProjectLink')} />
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
  },
});
