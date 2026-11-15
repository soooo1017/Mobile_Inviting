import { useRef, useState } from 'react';
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
import { KeyboardAwareForm, useKeyboardAwareForm } from '../../components/KeyboardAwareForm';
import { color, space } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PasswordChange'>;

const MIN_LENGTH = 8;

export function PasswordChangeScreen({ navigation }: Props) {
  const { changePassword, verifyPassword } = useAuth();
  const { scrollRef, fieldLayout, onFieldFocus } = useKeyboardAwareForm();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentError, setCurrentError] = useState(false);
  // 새 비밀번호 · 확인 칸의 안내는 입력하는 즉시 보여줘요(버튼을 누를 때까지 기다리지 않아요).
  const currentRef = useRef('');

  const newPasswordValid = newPassword.length >= MIN_LENGTH;
  const tooShort = newPassword.length > 0 && !newPasswordValid;
  const matchError = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = currentPassword.length > 0 && newPasswordValid && confirmPassword.length > 0 && !matchError;

  // 현재 비밀번호는 서버에 물어봐야 알 수 있어서, 글자를 칠 때마다 묻지 않고 칸을 벗어날 때(다음 칸으로 넘어갈 때) 확인해요.
  const checkCurrent = async () => {
    const typed = currentPassword;
    if (!typed) return;
    const ok = await verifyPassword(typed);
    // 확인하는 사이 글이 바뀌었으면 옛 결과는 버려요.
    if (currentRef.current === typed) setCurrentError(!ok);
  };

  const handleSave = async () => {
    if (loading || !canSubmit) return;
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
      <KeyboardAwareForm scrollRef={scrollRef}>
        <View style={styles.content}>
          <ScreenTitle>비밀번호 변경</ScreenTitle>

          <View style={styles.fields} onLayout={fieldLayout('fields')}>
            <View>
              <FieldLabel>현재 비밀번호</FieldLabel>
              <TextField
                value={currentPassword}
                onChangeText={(v) => {
                  setCurrentPassword(v);
                  currentRef.current = v;
                  setCurrentError(false);
                }}
                onBlur={checkCurrent}
                onSubmitEditing={checkCurrent}
                returnKeyType="next"
                placeholder="현재 비밀번호를 입력해주세요"
                onFocus={() => onFieldFocus('fields')}
                secureTextEntry={!showPasswords}
                autoCapitalize="none"
                autoCorrect={false}
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
                onChangeText={setNewPassword}
                placeholder="8자 이상 입력해주세요"
                onFocus={() => onFieldFocus('fields')}
                secureTextEntry={!showPasswords}
                autoCapitalize="none"
                autoCorrect={false}
                error={tooShort}
              />
              {tooShort ? <HelperText error>8자 이상 입력해주세요.</HelperText> : <HelperText>영문, 숫자를 포함해 8자 이상으로 설정해주세요.</HelperText>}
            </View>

            <View>
              <FieldLabel>새 비밀번호 확인</FieldLabel>
              <TextField
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="새 비밀번호를 다시 입력해주세요"
                onFocus={() => onFieldFocus('fields')}
                secureTextEntry={!showPasswords}
                autoCapitalize="none"
                autoCorrect={false}
                error={matchError}
              />
              {matchError ? <HelperText error>새 비밀번호가 서로 달라요.</HelperText> : null}
            </View>
          </View>

          <View style={styles.buttonWrap}>
            <PrimaryButton label="변경하기" onPress={handleSave} loading={loading} disabled={!canSubmit} />
          </View>
        </View>
      </KeyboardAwareForm>
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
