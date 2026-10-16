import { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { BackButton } from '../components/BackButton';
import { ScreenTitle } from '../components/ScreenTitle';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { KeyboardAwareForm } from '../components/KeyboardAwareForm';
import { EmailDomainChips } from '../components/EmailDomainChips';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetRequest'>;

export function ResetRequestScreen({ navigation }: Props) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email || loading) return;
    setLoading(true);
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
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <EmailDomainChips email={email} onSelect={setEmail} />
          </View>
          <PrimaryButton label="재설정 링크 보내기" onPress={handleSend} loading={loading} disabled={!email} />
        </View>

        <Text style={styles.notice}>
          카카오·Apple로 가입한 계정은{'\n'}해당 서비스에서 비밀번호를 관리합니다.
        </Text>
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
