import { SHOW_SOCIAL_LOGIN } from '../config/features';
import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { BackButton } from '../components/BackButton';
import { ScreenTitle } from '../components/ScreenTitle';
import { TextField } from '../components/TextField';
import { HelperText } from '../components/HelperText';
import { PrimaryButton } from '../components/PrimaryButton';
import { KeyboardAwareForm } from '../components/KeyboardAwareForm';
import { EmailDomainChips } from '../components/EmailDomainChips';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetRequest'>;

export function ResetRequestScreen({ navigation }: Props) {
  const { requestPasswordReset, isEmailAvailable } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  // true = 이 이메일로 가입된 계정이 없음(= 재설정 메일을 보낼 곳이 없음). null = 아직 모름 / 확인 못 함.
  const [notRegistered, setNotRegistered] = useState<boolean | null>(null);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // 가입 화면처럼 이메일을 끝까지 치면 바로 확인해요.
  useEffect(() => {
    if (!emailValid) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await isEmailAvailable(email);
      if (!cancelled) setNotRegistered(result);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [email, emailValid, isEmailAvailable]);

  const handleSend = async () => {
    if (!email || loading) return;
    setLoading(true);
    // 가입되지 않은 주소에는 메일을 보내지 않고 바로 알려요. 확인하지 못하면(null) 예전처럼 보내요.
    const unregistered = await isEmailAvailable(email);
    if (unregistered === true) {
      setNotRegistered(true);
      setLoading(false);
      return;
    }
    await requestPasswordReset(email);
    setLoading(false);
    navigation.navigate('ResetSent', { email });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <BackButton onPress={() => navigation.goBack()} />
      <KeyboardAwareForm contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <ScreenTitle>비밀번호 찾기</ScreenTitle>
          <Text style={styles.description}>가입한 이메일로 재설정 링크를 보내드려요.</Text>

          <View style={styles.field}>
            <TextField
              placeholder="이메일"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setNotRegistered(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              error={notRegistered === true}
            />
            <EmailDomainChips
              email={email}
              onSelect={(v) => {
                setEmail(v);
                setNotRegistered(null);
              }}
            />
            {notRegistered === true ? <HelperText error>가입되지 않은 이메일이에요. 다시 확인해 주세요.</HelperText> : null}
          </View>
          <PrimaryButton label="재설정 링크 보내기" onPress={handleSend} loading={loading} disabled={!email || notRegistered === true} />
        </View>

        {SHOW_SOCIAL_LOGIN ? (
          <Text style={styles.notice}>
            카카오·Apple로 가입한 계정은{'\n'}해당 서비스에서 비밀번호를 관리합니다.
          </Text>
        ) : null}
      </KeyboardAwareForm>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  scrollContent: {
    justifyContent: 'space-between',
  },
  content: {
    paddingHorizontal: space.screenX,
  },
  description: {
    ...textStyle({ size: 'body', weight: 'regular', color: color.ink.muted }),
    lineHeight: 12.5 * 1.6,
    marginTop: space[4],
  },
  field: {
    marginTop: space[8],
    marginBottom: space[8],
  },
  notice: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.secondary }),
    lineHeight: 11 * 1.6,
    textAlign: 'center',
    paddingHorizontal: space.screenX,
    paddingBottom: space[10],
  },
});
