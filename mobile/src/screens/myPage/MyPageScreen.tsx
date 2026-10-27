import { SHOW_SOCIAL_LOGIN } from '../../config/features';
import { Fragment } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../state/AuthContext';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';

type Props = BottomTabScreenProps<MainTabParamList, 'My'>;

type Row = {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
};

export function MyPageScreen(_props: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { auth, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'HomeGuest' }] }));
  };

  const accountRows: Row[] = [
    { label: '닉네임 변경', onPress: () => navigation.navigate('NicknameEdit') },
    { label: '비밀번호 변경', onPress: () => navigation.navigate('PasswordChange') },
    ...(SHOW_SOCIAL_LOGIN ? [{ label: '소셜 계정 연동', onPress: () => navigation.navigate('SocialAccounts') }] : []),
  ];
  const notificationRows: Row[] = [
    { label: '알림 설정', onPress: () => navigation.navigate('NotificationSettings') },
  ];
  const supportRows: Row[] = [
    { label: '문의', onPress: () => navigation.navigate('Inquiry', {}) },
    { label: '앱 버전 정보', value: '1.0.0' },
  ];
  const policyRows: Row[] = [
    { label: '이용약관', onPress: () => navigation.navigate('Terms') },
    { label: '개인정보처리방침', onPress: () => navigation.navigate('PrivacyPolicy') },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>My Page</Text>

        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarMark}>{(auth.user?.nickname ?? '?').slice(0, 1)}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.nickname}>{auth.user?.nickname}</Text>
            <Text style={styles.email}>{auth.user?.email}</Text>
          </View>
        </View>

        <Section label="계정 설정" rows={accountRows} />
        <Section label="알림 설정" rows={notificationRows} />
        <Section label="지원" rows={supportRows} />
        <Section label="약관 및 정책" rows={policyRows} />

        <View style={styles.exitZone}>
          <Pressable onPress={handleLogout} hitSlop={8}>
            <Text style={styles.exitLabel}>로그아웃</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('AccountDeletion')} hitSlop={8}>
            <Text style={[styles.exitLabel, styles.danger]}>회원 탈퇴</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ label, rows }: { label: string; rows: Row[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionBody}>
        {rows.map((row, i) => (
          <Fragment key={row.label}>
            {i > 0 ? <View style={styles.rowDivider} /> : null}
            <Pressable
              onPress={row.onPress}
              disabled={!row.onPress}
              style={styles.row}
            >
              <Text style={[styles.rowLabel, row.danger && styles.danger]}>{row.label}</Text>
              {row.value ? <Text style={styles.rowValue}>{row.value}</Text> : row.onPress ? (
                <Text style={styles.chevron}>›</Text>
              ) : null}
            </Pressable>
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  content: {
    paddingHorizontal: space.screenX,
    paddingBottom: space[10],
  },
  title: {
    ...textStyle({ size: 'display', weight: 'semibold', lineHeight: 'heading', letterSpacing: 'heading', color: color.ink.primary }),
    marginTop: space[9],
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[6],
    marginTop: space[9],
    marginBottom: space[8],
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.circle,
    backgroundColor: color.accent.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMark: {
    ...textStyle({ size: 'title1', weight: 'semibold', color: color.accent.base }),
  },
  profileText: {
    gap: space[2],
  },
  nickname: {
    ...textStyle({ size: 'title3', weight: 'semibold', color: color.ink.primary }),
  },
  email: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
  },
  section: {
    marginTop: space[8],
  },
  sectionLabel: {
    ...textStyle({ size: 'small', weight: 'medium', color: color.ink.muted }),
    marginBottom: space[4],
  },
  sectionBody: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[7],
    paddingVertical: space[7],
  },
  rowDivider: {
    height: 1,
    backgroundColor: color.line.soft,
    marginHorizontal: space[7],
  },
  rowLabel: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.primary }),
  },
  rowValue: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
  },
  chevron: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.placeholder }),
  },
  danger: {
    color: color.status.error,
  },
  exitZone: {
    marginTop: space[10],
    alignItems: 'center',
    gap: space[6],
  },
  exitLabel: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
  },
});
