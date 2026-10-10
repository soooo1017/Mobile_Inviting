import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextLink } from '../components/TextLink';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'SignupSent'>;

const RESEND_COOLDOWN_SECONDS = 60;

export function SignupSentScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = () => {
    if (cooldown > 0) return;
    setCooldown(RESEND_COOLDOWN_SECONDS);
    supabase.auth.resend({ type: 'signup', email });
  };

  const backToLogin = () => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
  };

  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        <View style={styles.icon}>
          <Text style={styles.iconMark}>✓</Text>
        </View>
        <Text style={styles.title}>확인 메일을 보냈어요</Text>
        <Text style={styles.body}>
          {email} 으로 보낸{'\n'}링크를 눌러 이메일을 인증해주세요.{'\n'}인증 후에 로그인할 수 있어요.
        </Text>
      </View>

      <View style={styles.bottom}>
        <PrimaryButton label="로그인으로 가기" onPress={backToLogin} />
        <TextLink
          size="label"
          weight="medium"
          color={cooldown > 0 ? color.ink.placeholder : color.accent.base}
          onPress={handleResend}
        >
          {cooldown > 0 ? `메일이 오지 않았나요? 다시 보내기 (${cooldown}s)` : '메일이 오지 않았나요? 다시 보내기'}
        </TextLink>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[6],
    paddingHorizontal: 26,
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
  bottom: {
    paddingHorizontal: space.screenX,
    paddingBottom: space[9],
    alignItems: 'center',
    gap: space[5],
  },
});
