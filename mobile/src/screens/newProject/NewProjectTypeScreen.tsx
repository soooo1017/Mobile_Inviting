import { useCallback } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useNewProjectDraft } from '../../state/NewProjectDraftContext';
import { WizardHeader } from './WizardHeader';
import { SelectTile, TileRow } from '../../components/SelectTile';
import { FieldLabel } from '../../components/FieldLabel';
import { TextField } from '../../components/TextField';
import { HelperText } from '../../components/HelperText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { KeyboardAwareForm, useKeyboardAwareForm } from '../../components/KeyboardAwareForm';
import { color, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { EVENT_TYPES, eventTypeMeta } from '../../types/project';
import { ExitConfirmGate } from './ExitConfirmGate';

type Props = NativeStackScreenProps<RootStackParamList, 'NewProjectType'>;

export function NewProjectTypeScreen({ navigation }: Props) {
  const { draft, update, reset } = useNewProjectDraft();
  const { scrollRef, fieldLayout, onFieldFocus } = useKeyboardAwareForm();

  // 마법사의 시작점이라, 처음 들어올 때든 2~4단계에서 뒤로가기로 돌아올 때든
  // 이 화면이 포커스될 때마다 이전 작성 내용을 전부 비운다.
  useFocusEffect(
    useCallback(() => {
      reset();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const selectType = (type: (typeof EVENT_TYPES)[number]['type']) => {
    const meta = eventTypeMeta(type);
    update({ eventType: type, hosts: meta.hostLabels.map((label) => ({ label, name: '' })) });
  };

  const canProceed = draft.eventType !== 'other' || draft.customTypeName.trim().length > 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <WizardHeader onBack={() => navigation.goBack()} step={1} stepLabel="행사 유형" />
      <KeyboardAwareForm
        scrollRef={scrollRef}
        contentContainerStyle={styles.content}
        footer={
          <View style={styles.footer}>
            <PrimaryButton label="다음" onPress={() => navigation.navigate('NewProjectInfo')} disabled={!canProceed} />
          </View>
        }
      >
        <Text style={styles.title}>어떤 행사인가요?</Text>
        <Text style={styles.desc}>
          유형에 따라 입력 칸 이름만 바뀌어요.{'\n'}구성과 문구는 모두 자유롭게 고칠 수 있어요.
        </Text>

        <View style={styles.grid}>
          {Array.from({ length: Math.ceil(EVENT_TYPES.length / 2) }).map((_, row) => (
            <TileRow key={row}>
              {EVENT_TYPES.slice(row * 2, row * 2 + 2).map((t) => (
                <SelectTile
                  key={t.type}
                  title={t.label}
                  subtitle={t.subtitle}
                  selected={draft.eventType === t.type}
                  onPress={() => selectType(t.type)}
                />
              ))}
            </TileRow>
          ))}
        </View>

        {draft.eventType === 'other' ? (
          <View style={styles.customField} onLayout={fieldLayout('custom')}>
            <FieldLabel>행사 이름</FieldLabel>
            <TextField
              value={draft.customTypeName}
              onChangeText={(v) => update({ customTypeName: v })}
              onFocus={() => onFieldFocus('custom')}
              placeholder="예: 송년회"
              autoFocus
            />
            <HelperText>프로젝트 목록에 표시돼요.</HelperText>
          </View>
        ) : null}
      </KeyboardAwareForm>
      <ExitConfirmGate />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  content: {
    paddingHorizontal: space.screenX,
    paddingTop: space[8],
  },
  title: {
    ...textStyle({ size: 'step', weight: 'semibold', color: color.ink.primary }),
  },
  desc: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
    lineHeight: 11.5 * 1.5,
    marginTop: space[4],
  },
  grid: {
    gap: space[5],
    marginTop: space[8],
  },
  customField: {
    marginTop: space[8],
  },
  footer: {
    paddingHorizontal: space.screenX,
    paddingBottom: space[9],
    paddingTop: space[6],
  },
});
