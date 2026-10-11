import { useEffect, useState } from 'react';
import { Alert, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { BackButton } from '../components/BackButton';
import { FieldLabel } from '../components/FieldLabel';
import { TextField } from '../components/TextField';
import { HelperText } from '../components/HelperText';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextLink } from '../components/TextLink';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetSent'>;

const RESEND_COOLDOWN_SECONDS = 60;
const MIN_LENGTH = 8;

export function ResetSentScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const { requestPasswordReset, confirmPasswordReset } = useAuth();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [matchError, setMatchError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    setCooldown(RESEND_COOLDOWN_SECONDS);
    await requestPasswordReset(email);
  };

  const backToLogin = () => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
  };

  const canSubmit = code.trim().length === 6 && newPassword.length >= MIN_LENGTH && confirmPassword.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    if (newPassword !== confirmPassword) {
      setMatchError(true);
      return;
    }
    setMatchError(false);
    setCodeError(false);
    setLoading(true);
    const result = await confirmPasswordReset(email, code.trim(), newPassword);
    setLoading(false);
    if (!result.ok) {
      if (result.error === 'invalid_code') setCodeError(true);
      return;
    }
    Alert.alert('비밀번호를 변경했어요', '새 비밀번호로 다시 로그인해주세요.');
    backToLogin();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <BackButton onPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.icon}>
            <Text style={styles.iconMark}>✓</Text>
          </View>
          <Text style={styles.title}>메일을 보냈어요</Text>
          <Text style={styles.body}>
            {email} 으로 보낸{'\n'}6자리 인증 코드를 아래에 입력해주세요.{'\n'}코드는 30분간 유효합니다.
          </Text>
        </View>

        <View style={styles.field}>
          <FieldLabel>인증 코드</FieldLabel>
          <TextField
            value={code}
            onChangeText={(v) => {
              setCode(v.replace(/[^0-9]/g, '').slice(0, 6));
              setCodeError(false);
            }}
            placeholder="6자리 숫자"
            keyboardType="number-pad"
            maxLength={6}
            error={codeError}
          />
          {codeError ? <HelperText error>인증 코드가 맞지 않거나 만료됐어요.</HelperText> : null}
        </View>

        <View style={styles.field}>
          <FieldLabel>새 비밀번호</FieldLabel>
          <TextField
            value={newPassword}
            onChangeText={(v) => {
              setNewPassword(v);
              setMatchError(false);
            }}
            placeholder="8자 이상 입력해주세요"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.field}>
          <FieldLabel>새 비밀번호 확인</FieldLabel>
          <TextField
            value={confirmPassword}
            onChangeText={(v) => {
              setConfirmPassword(v);
              setMatchError(false);
            }}
            placeholder="새 비밀번호를 다시 입력해주세요"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            error={matchError}
          />
          {matchError ? <HelperText error>새 비밀번호가 서로 달라요.</HelperText> : null}
        </View>

        <View style={styles.buttonWrap}>
          <PrimaryButton label="비밀번호 재설정" onPress={handleSubmit} loading={loading} disabled={!canSubmit} />
        </View>
      </View>

      <View style={styles.bottom}>
        <TextLink
          size="label"
          weight="medium"
          color={cooldown > 0 ? color.ink.placeholder : color.accent.base}
          onPress={handleResend}
        >
          {cooldown > 0 ? `코드가 오지 않았나요? 다시 보내기 (${cooldown}s)` : '코드가 오지 않았나요? 다시 보내기'}
        </TextLink>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
    justifyContent: 'space-between',
  },
  content: {
    paddingHorizontal: space.screenX,
  },
  header: {
    alignItems: 'center',
    gap: space[6],
    paddingBottom: space[9],
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: color.accent.tint,
    borderWidth: 1,
    borderColor: color.accent.tintBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMark: {
    color: color.accent.base,
    fontSize: 19,
    fontWeight: '700',
  },
  title: {
    ...textStyle({ size: 'title2', weight: 'semibold', color: color.ink.primary }),
  },
  body: {
    ...textStyle({ size: 'body', weight: 'regular', color: color.ink.muted }),
    lineHeight: 12.5 * 1.75,
    textAlign: 'center',
  },
  field: {
    marginTop: space[6],
  },
  buttonWrap: {
    marginTop: space[8],
  },
  bottom: {
    paddingHorizontal: space.screenX,
    paddingBottom: space[9],
    alignItems: 'center',
    gap: space[5],
  },
});
