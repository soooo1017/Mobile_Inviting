import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { BackButton } from '../components/BackButton';
import { ScreenTitle } from '../components/ScreenTitle';
import { FieldLabel } from '../components/FieldLabel';
import { TextField } from '../components/TextField';
import { HelperText } from '../components/HelperText';
import { Checkbox } from '../components/Checkbox';
import { TextLink } from '../components/TextLink';
import { PrimaryButton } from '../components/PrimaryButton';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const USERNAME_RE = /^[a-zA-Z0-9_]{4,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const USERNAME_CHECK_DEBOUNCE_MS = 400;

export function SignupScreen({ navigation }: Props) {
  const { signup, isUsernameAvailable } = useAuth();
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const usernameFormatValid = USERNAME_RE.test(username);
  const emailValid = EMAIL_RE.test(email);
  const passwordValid = PASSWORD_RE.test(password);
  const confirmMismatch = confirmTouched && confirm.length > 0 && confirm !== password;
  const confirmValid = confirm.length > 0 && confirm === password;

  useEffect(() => {
    // onChangeText already resets usernameAvailable to null on every keystroke,
    // so an invalid format just means "don't start a check" — nothing to reset here.
    if (!usernameFormatValid) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const available = await isUsernameAvailable(username);
      if (!cancelled) setUsernameAvailable(available);
    }, USERNAME_CHECK_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, usernameFormatValid, isUsernameAvailable]);

  const agreeAll = agreeTerms && agreePrivacy && agreeMarketing;
  const toggleAll = () => {
    const next = !agreeAll;
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgreeMarketing(next);
  };

  const canSubmit =
    usernameFormatValid && usernameAvailable === true && emailValid && passwordValid && confirmValid && agreeTerms && agreePrivacy;

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setSubmitError(null);
    const result = await signup(username, email, password);
    setLoading(false);
    if (!result.ok) {
      if (result.error === 'username_taken') {
        setUsernameAvailable(false);
      } else if (result.error === 'email_taken') {
        setSubmitError('이미 가입된 이메일이에요.');
      } else {
        setSubmitError('가입 중 문제가 발생했어요. 다시 시도해주세요.');
      }
      return;
    }
    navigation.navigate('SignupSent', { email });
  };

  return (
    <View style={styles.screen}>
      <BackButton onPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <ScreenTitle>회원가입</ScreenTitle>

        <View style={styles.field}>
          <FieldLabel>아이디</FieldLabel>
          <TextField
            placeholder="영문·숫자·_ 4~20자"
            value={username}
            onChangeText={(v) => {
              setUsername(v);
              setUsernameAvailable(null);
            }}
            autoCapitalize="none"
            error={usernameFormatValid && usernameAvailable === false}
          />
          {!usernameFormatValid && username.length > 0 ? (
            <HelperText error>영문, 숫자, _만 사용해 4~20자로 입력해주세요</HelperText>
          ) : usernameAvailable === false ? (
            <HelperText error>이미 사용 중인 아이디예요</HelperText>
          ) : usernameAvailable === true ? (
            <HelperText>사용할 수 있는 아이디예요</HelperText>
          ) : (
            <HelperText>로그인할 때 이 아이디를 사용해요</HelperText>
          )}
        </View>

        <View style={styles.field}>
          <FieldLabel>이메일</FieldLabel>
          <TextField
            placeholder="jiwon@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <HelperText>가입 확인 메일을 받을 주소예요</HelperText>
        </View>

        <View style={styles.field}>
          <FieldLabel>비밀번호</FieldLabel>
          <TextField placeholder="비밀번호" value={password} onChangeText={setPassword} secureTextEntry />
          <HelperText>영문·숫자 포함 8자 이상</HelperText>
        </View>

        <View style={styles.field}>
          <FieldLabel>비밀번호 확인</FieldLabel>
          <TextField
            placeholder="비밀번호 확인"
            value={confirm}
            onChangeText={setConfirm}
            onBlur={() => setConfirmTouched(true)}
            secureTextEntry
            error={confirmMismatch}
          />
          {confirmMismatch ? <HelperText error>비밀번호가 일치하지 않아요</HelperText> : null}
        </View>

        <View style={styles.agreeSection}>
          <View style={styles.agreeAllRow}>
            <Checkbox checked={agreeAll} onPress={toggleAll} />
            <Text style={styles.agreeAllLabel}>약관 전체 동의</Text>
          </View>
          <View style={styles.agreeDivider} />

          <AgreementRow label="(필수) 이용약관" checked={agreeTerms} onToggle={() => setAgreeTerms((v) => !v)} />
          <AgreementRow
            label="(필수) 개인정보 수집·이용"
            checked={agreePrivacy}
            onToggle={() => setAgreePrivacy((v) => !v)}
          />
          <AgreementRow
            label="(선택) 마케팅 정보 수신"
            checked={agreeMarketing}
            onToggle={() => setAgreeMarketing((v) => !v)}
          />
        </View>
      </View>

      <View style={styles.bottom}>
        {submitError ? <HelperText error>{submitError}</HelperText> : null}
        <PrimaryButton label="가입하고 시작하기" onPress={handleSubmit} disabled={!canSubmit} loading={loading} />
      </View>
    </View>
  );
}

function AgreementRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <View style={styles.agreeRow}>
      <Checkbox checked={checked} onPress={onToggle} />
      <Text style={styles.agreeLabel}>{label}</Text>
      <TextLink size="small" color={color.ink.placeholder} onPress={() => {}}>
        보기
      </TextLink>
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
  field: {
    marginTop: 15,
  },
  agreeSection: {
    marginTop: space[9],
  },
  agreeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingBottom: space[5],
  },
  agreeAllLabel: {
    ...textStyle({ size: 'control', weight: 'medium', color: color.ink.primary }),
  },
  agreeDivider: {
    height: 1,
    backgroundColor: color.line.default,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingTop: space[5],
  },
  agreeLabel: {
    flex: 1,
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.label }),
  },
  bottom: {
    paddingHorizontal: space.screenX,
    paddingBottom: space[9],
    paddingTop: space[7],
  },
});
