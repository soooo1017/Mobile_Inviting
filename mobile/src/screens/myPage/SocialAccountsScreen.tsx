import { Alert, Pressable, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { BackButton } from '../../components/BackButton';
import { ScreenTitle } from '../../components/ScreenTitle';
import { KakaoIcon } from '../../components/icons/KakaoIcon';
import { AppleIcon } from '../../components/icons/AppleIcon';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'SocialAccounts'>;

export function SocialAccountsScreen({ navigation }: Props) {
  const handleConnect = (provider: 'kakao' | 'apple') => {
    Alert.alert(provider === 'kakao' ? '카카오 연동' : 'Apple 연동', '준비 중이에요. 곧 지원할 예정이에요.');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <BackButton onPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <ScreenTitle>소셜 계정 연동</ScreenTitle>

        <View style={styles.list}>
          <Row icon={<KakaoIcon />} label="카카오" onPress={() => handleConnect('kakao')} />
          <View style={styles.divider} />
          <Row icon={<AppleIcon />} label="Apple" onPress={() => handleConnect('apple')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Row({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowLeft}>
        {icon}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.status}>연동 안 함</Text>
    </Pressable>
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
  list: {
    marginTop: space[8],
    backgroundColor: color.bg.surface,
    borderRadius: radius.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[7],
    paddingVertical: space[7],
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
  },
  divider: {
    height: 1,
    backgroundColor: color.line.soft,
    marginHorizontal: space[7],
  },
  label: {
    ...textStyle({ size: 'control', weight: 'medium', color: color.ink.primary }),
  },
  status: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
  },
});
