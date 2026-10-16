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
import { HelperText } from '../../components/HelperText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { KeyboardAwareForm } from '../../components/KeyboardAwareForm';
import { color, space } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'NicknameEdit'>;

export function NicknameEditScreen({ navigation }: Props) {
  const { auth, updateNickname } = useAuth();
  const [nickname, setNickname] = useState(auth.user?.nickname ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const trimmed = nickname.trim();
  const unchanged = trimmed === (auth.user?.nickname ?? '');

  const handleSave = async () => {
    if (loading || !trimmed || unchanged) return;
    setLoading(true);
    const result = await updateNickname(trimmed);
    setLoading(false);
    if (!result.ok) {
      setError(true);
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <BackButton onPress={() => navigation.goBack()} />
      <KeyboardAwareForm>
        <View style={styles.content}>
          <ScreenTitle>닉네임 변경</ScreenTitle>

          <View style={styles.field}>
            <FieldLabel>닉네임</FieldLabel>
            <TextField
              value={nickname}
              onChangeText={(v) => {
                setNickname(v);
                setError(false);
              }}
              placeholder="닉네임을 입력해주세요"
              maxLength={20}
              error={error}
            />
            {error ? <HelperText error>닉네임을 변경하지 못했어요. 다시 시도해주세요.</HelperText> : null}
          </View>

          <View style={styles.buttonWrap}>
            <PrimaryButton
              label="저장하기"
              onPress={handleSave}
              loading={loading}
              disabled={!trimmed || unchanged}
            />
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
  field: {
    marginTop: space[8],
  },
  buttonWrap: {
    marginTop: space[9],
  },
});
