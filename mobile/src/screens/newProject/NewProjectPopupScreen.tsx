import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useNewProjectDraft } from '../../state/NewProjectDraftContext';
import { WizardHeader } from './WizardHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { PopupStartPicker } from '../../editor/PopupStartPicker';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'NewProjectPopup'>;

/** 4/5 — 안내 팝업을 쓸지, 쓴다면 행사 며칠 전부터 보여줄지. 내용은 에디터에서 만들어요. */
export function NewProjectPopupScreen({ navigation }: Props) {
  const { draft, update } = useNewProjectDraft();
  const { enabled, startDays } = draft.popup;
  const set = (patch: Partial<typeof draft.popup>) => update({ popup: { ...draft.popup, ...patch } });
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <WizardHeader onBack={() => navigation.goBack()} step={4} stepLabel="안내 팝업" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{'초대장을 열면 먼저 뜨는\n안내 팝업을 쓸까요?'}</Text>
        <Text style={styles.desc}>{'행사 전 중요한 내용(주차 · 셔틀 · 식사 · 드레스코드 등)을\n팝업 창으로 먼저 보여줘요.'}</Text>
        <View style={styles.toggleGroup}>
          <Pressable style={[styles.toggle, enabled && styles.toggleSelected]} onPress={() => set({ enabled: true })}>
            <Text style={[styles.toggleLabel, enabled && styles.toggleLabelSelected]}>안내 팝업 사용하기</Text>
          </Pressable>
          <Pressable style={[styles.toggle, !enabled && styles.toggleSelected]} onPress={() => set({ enabled: false })}>
            <Text style={[styles.toggleLabel, !enabled && styles.toggleLabelSelected]}>사용하지 않기</Text>
          </Pressable>
        </View>
        {enabled ? (
          <View style={styles.section}>
            <PopupStartPicker eventAt={draft.eventAt} value={startDays} onChange={(v) => set({ startDays: v })} />
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton label="다음" onPress={() => navigation.navigate('ThemeSelect')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg.canvas },
  content: { paddingHorizontal: space.screenX, paddingTop: space[8] },
  title: { ...textStyle({ size: 'step', weight: 'semibold', lineHeight: 'heading', color: color.ink.primary }) },
  desc: { ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }), lineHeight: 11.5 * 1.5, marginTop: space[4] },
  toggleGroup: { gap: space[4], marginTop: space[8] },
  toggle: { borderWidth: 1, borderColor: color.line.chip, borderRadius: radius.button, paddingVertical: 15, alignItems: 'center', backgroundColor: color.bg.surface },
  toggleSelected: { backgroundColor: color.select.fill, borderColor: color.select.fill },
  toggleLabel: { ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }) },
  toggleLabelSelected: { color: color.select.on },
  section: { marginTop: space[8] },
  footer: { paddingHorizontal: space.screenX, paddingBottom: space[9], paddingTop: space[6] },
});
