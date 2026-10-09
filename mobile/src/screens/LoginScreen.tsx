import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { BackButton } from '../components/BackButton';
import { ScreenTitle } from '../components/ScreenTitle';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextLink } from '../components/TextLink';
import { KakaoIcon } from '../components/icons/KakaoIcon';
import { AppleIcon } from '../components/icons/AppleIcon';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login, loginWithProvider } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const goToHome = () => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
  };

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      goToHome();
    } else {
      setError(true);
    }
  };

  const handleSocial = async (provider: 'kakao' | 'apple') => {
    if (loading) return;
    await loginWithProvider(provider);
    goToHome();
  };

  return (
    <View style={styles.screen}>
      <BackButton onPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <ScreenTitle>로그인</ScreenTitle>

        <View style={styles.fields}>
          <TextField
            placeholder="이메일"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError(false);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            error={error}
          />
          <TextField
            placeholder="비밀번호"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setError(false);
            }}
            secureTextEntry={!showPassword}
            error={error}
            rightElement={<TextLink size="small" color={color.ink.secondary} onPress={() => setShowPassword((v) => !v)}>보기</TextLink>}
          />
        </View>

        {error ? (
          <View style={styles.errorRow}>
            <View style={styles.errorDot}>
              <Text style={styles.errorMark}>!</Text>
            </View>
            <Text style={styles.errorText}>이메일 또는 비밀번호가 맞지 않습니다.</Text>
          </View>
        ) : null}

        <View style={styles.primaryButtonWrap}>
          <PrimaryButton label="로그인" onPress={handleLogin} loading={loading} />
        </View>

        {!error && (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>간편 로그인</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => handleSocial('kakao')}
                style={[styles.socialButton, styles.kakaoButton]}
              >
                <KakaoIcon />
                <Text style={styles.kakaoLabel}>카카오</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => handleSocial('apple')}
                style={[styles.socialButton, styles.appleButton]}
              >
                <AppleIcon />
                <Text style={styles.appleLabel}>Apple</Text>
              </Pressable>
            </View>
          </>
        )}

        <View style={styles.linkRow}>
          <TextLink
            weight={error ? 'semibold' : 'regular'}
            color={error ? color.accent.base : color.ink.muted}
            onPress={() => navigation.navigate('ResetRequest')}
          >
            비밀번호 찾기
          </TextLink>
          <Text style={styles.linkSeparator}>|</Text>
          <TextLink
            weight={error ? 'regular' : 'semibold'}
            color={error ? color.ink.muted : color.accent.base}
            onPress={() => navigation.navigate('Signup')}
          >
            회원가입
          </TextLink>
        </View>
      </View>

      {!error && (
        <Text style={styles.notice}>
          로그인하면 이용약관과 개인정보처리방침에{'\n'}동의한 것으로 봅니다.
        </Text>
      )}
    </View>
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
  fields: {
    marginTop: space[8],
    gap: space[5],
  },
  primaryButtonWrap: {
    marginTop: space[8],
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    paddingTop: space[1],
    marginTop: space[3],
  },
  errorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: color.status.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  errorMark: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
  },
  errorText: {
    flex: 1,
    ...textStyle({ size: 'label', weight: 'regular', color: color.status.error }),
    lineHeight: 11.5 * 1.5,
  },
  divider: {
    marginTop: space[9],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[6],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: color.line.default,
  },
  dividerLabel: {
    ...textStyle({ size: 'micro', weight: 'regular', color: color.ink.secondary }),
  },
  socialRow: {
    marginTop: space[7],
    flexDirection: 'row',
    gap: space[5],
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[4],
    borderRadius: radius.button,
    paddingVertical: 14,
  },
  kakaoButton: {
    backgroundColor: color.brand.kakaoBg,
  },
  kakaoLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.brand.kakaoInk }),
  },
  appleButton: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.ink.primary,
  },
  appleLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  linkRow: {
    marginTop: space[8],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[7],
  },
  linkSeparator: {
    color: color.line.separator,
  },
  notice: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.secondary }),
    lineHeight: 11 * 1.6,
    textAlign: 'center',
    paddingHorizontal: space.screenX,
    paddingTop: space[9],
    paddingBottom: space[10],
  },
});
