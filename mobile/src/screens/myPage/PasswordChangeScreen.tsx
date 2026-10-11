import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../state/AuthContext';
import { BackButton } from '../../components/BackButton';
import { ScreenTitle } from '../../components/ScreenTitle';
import { FieldLabel } from '../../components/FieldLabel';
import { TextField } from '../../components/TextField';
import { TextLink } from '../../components/TextLink';
import { HelperText } from '../../components/HelperText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { color, space } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PasswordChange'>;

const MIN_LENGTH = 8;

export function PasswordChangeScreen({ navigation }: Props) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentError, setCurrentError] = useState(false);
  const [matchError, setMatchError] = useState(false);

  const newPasswordValid = newPassword.length >= MIN_LENGTH;
  const canSubmit = currentPassword.length > 0 && newPasswordValid && confirmPassword.length > 0;

  const handleSave = async () => {
    if (loading || !canSubmit) return;
    if (newPassword !== confirmPassword) {
      setMatchError(true);
      return;
    }
    setMatchError(false);
    setCurrentError(false);
    setLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setLoading(false);
    if (!result.ok) {
      if (result.error === 'invalid_current_password') {
        setCurrentError(true);
      }
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <BackButton onPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <ScreenTitle>비밀번호 변경</ScreenTitle>

        <View style={styles.fields}>
          <View>
            <FieldLabel>현재 비밀번호</FieldLabel>
            <TextField
              value={currentPassword}
              onChangeText={(v) => {
                setCurrentPassword(v);
                setCurrentError(false);
              }}
              placeholder="현재 비밀번호를 입력해주세요"
              secureTextEntry={!showPasswords}
              error={currentError}
              rightElement={
                <TextLink size="small" color={color.ink.secondary} onPress={() => setShowPasswords((v) => !v)}>
                  보기
                </TextLink>
              }
            />
            {currentError ? <HelperText error>현재 비밀번호가 맞지 않아요.</HelperText> : null}
          </View>

          <View>
            <FieldLabel>새 비밀번호</FieldLabel>
            <TextField
              value={newPassword}
              onChangeText={(v) => {
                setNewPassword(v);
                setMatchError(false);
              }}
              placeholder="8자 이상 입력해주세요"
              secureTextEntry={!showPasswords}
            />
            <HelperText>영문, 숫자를 포함해 8자 이상으로 설정해주세요.</HelperText>
          </View>

          <View>
            <FieldLabel>새 비밀번호 확인</FieldLabel>
            <TextField
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                setMatchError(false);
              }}
              placeholder="새 비밀번호를 다시 입력해주세요"
              secureTextEntry={!showPasswords}
              error={matchError}
            />
            {matchError ? <HelperText error>새 비밀번호가 서로 달라요.</HelperText> : null}
          </View>
        </View>

        <View style={styles.buttonWrap}>
          <PrimaryButton label="변경하기" onPress={handleSave} loading={loading} disabled={!canSubmit} />
        </View>
      </View>
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
  },
  fields: {
    marginTop: space[8],
    gap: space[7],
  },
  buttonWrap: {
    marginTop: space[9],
  },
});
