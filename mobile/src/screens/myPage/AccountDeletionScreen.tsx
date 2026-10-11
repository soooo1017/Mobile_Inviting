import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../state/AuthContext';
import { BackButton } from '../../components/BackButton';
import { ScreenTitle } from '../../components/ScreenTitle';
import { FieldLabel } from '../../components/FieldLabel';
import { TextField } from '../../components/TextField';
import { HelperText } from '../../components/HelperText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountDeletion'>;

const REASONS = [
  '서비스를 더 이상 이용하지 않아요',
  '원하는 기능이 없어요',
  '사용법이 어려워요',
  '오류나 버그가 많아요',
  '다른 서비스를 이용해요',
  '기타',
];

export function AccountDeletionScreen({ navigation }: Props) {
  const { deleteAccount } = useAuth();
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const detailRequired = reason === '기타';
  const canSubmit = Boolean(reason) && (!detailRequired || detail.trim().length > 0) && password.length > 0;

  const handleDelete = async () => {
    if (loading || !reason) return;
    setLoading(true);
    const result = await deleteAccount(password, reason, detail.trim());
    setLoading(false);
    setConfirmVisible(false);
    if (!result.ok) {
      if (result.error === 'invalid_password') {
        setPasswordError(true);
      }
      return;
    }
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'HomeGuest' }] }));
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <BackButton onPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle>회원 탈퇴</ScreenTitle>
        <Text style={styles.notice}>
          탈퇴하면 모든 초대장과 응답 데이터가 삭제되며{'\n'}복구할 수 없어요.
        </Text>

        <View style={styles.field}>
          <FieldLabel>탈퇴 사유를 알려주세요</FieldLabel>
          <View style={styles.reasonList}>
            {REASONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setReason(r)}
                style={styles.reasonRow}
              >
                <View style={[styles.radio, reason === r && styles.radioSelected]}>
                  {reason === r ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={styles.reasonLabel}>{r}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {detailRequired ? (
          <View style={styles.field}>
            <TextField
              value={detail}
              onChangeText={setDetail}
              placeholder="어떤 이유인지 알려주세요"
              multiline
              style={styles.detailInput}
            />
          </View>
        ) : null}

        <View style={styles.field}>
          <FieldLabel>비밀번호 확인</FieldLabel>
          <TextField
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setPasswordError(false);
            }}
            placeholder="비밀번호를 입력해주세요"
            secureTextEntry
            error={passwordError}
          />
          {passwordError ? <HelperText error>비밀번호가 맞지 않아요.</HelperText> : null}
        </View>

        <View style={styles.buttonWrap}>
          <PrimaryButton label="탈퇴하기" onPress={() => setConfirmVisible(true)} disabled={!canSubmit} />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmVisible}
        title={'정말 탈퇴하시겠어요?\n탈퇴하면 되돌릴 수 없어요.'}
        confirmLabel="탈퇴하기"
        onCancel={() => setConfirmVisible(false)}
        onConfirm={handleDelete}
        confirmDisabled={loading}
      />
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
    paddingBottom: space[10],
  },
  notice: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.status.error }),
    lineHeight: 14 * 1.5,
    marginTop: space[6],
  },
  field: {
    marginTop: space[8],
  },
  reasonList: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.card,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingHorizontal: space[7],
    paddingVertical: space[6],
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: radius.circle,
    borderWidth: 1,
    borderColor: color.line.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: color.accent.base,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.circle,
    backgroundColor: color.accent.base,
  },
  reasonLabel: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.primary }),
  },
  detailInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonWrap: {
    marginTop: space[9],
  },
});
