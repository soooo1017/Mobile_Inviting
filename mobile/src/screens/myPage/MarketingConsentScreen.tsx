import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { BackButton } from '../../components/BackButton';
import { color, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'MarketingConsent'>;

// 회원가입의 "(선택) 마케팅 정보 수신" 동의 내용. 회사 정보([…])는 이용약관 · 개인정보처리방침과 같이 나중에 채워요.
// 초안이라 출시 전에 법률 검토를 받아요(TODO.md).
const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. 수신에 동의하면 받는 정보',
    body: '[서비스명]의 새 기능·템플릿 소식, 이벤트·혜택, 서비스 이용 팁 등 광고성 정보를 보내드립니다. 서비스 이용에 꼭 필요한 안내(가입 확인, 비밀번호 재설정, 약관·정책 변경, 참석 응답·방명록 알림 등)는 이 동의와 관계없이 발송됩니다.',
  },
  {
    heading: '2. 수신 방법',
    body: '앱 푸시 알림, 가입 시 등록한 이메일로 보냅니다.',
  },
  {
    heading: '3. 이용하는 개인정보와 목적',
    body: '· 항목: 이메일 주소, 닉네임, 서비스 이용 기록\n· 목적: 위 광고성 정보의 발송, 이벤트 안내 및 서비스 개선을 위한 안내',
  },
  {
    heading: '4. 보유 및 이용 기간',
    body: '동의를 철회하거나 회원 탈퇴 시까지 보유·이용하며, 철회 또는 탈퇴 시 지체 없이 파기합니다.',
  },
  {
    heading: '5. 동의하지 않아도 괜찮아요',
    body: '이 동의는 선택입니다. 동의하지 않아도 회원가입과 서비스 이용에는 아무런 제한이나 불이익이 없습니다.',
  },
  {
    heading: '6. 동의 철회(수신 거부) 방법',
    body: '언제든지 앱의 마이페이지 › 알림 설정 › "마케팅·이벤트 알림"을 끄면 수신이 중단됩니다. 이메일에 포함된 수신 거부 안내나 고객 문의([이메일])로도 요청할 수 있습니다.',
  },
  {
    heading: '7. 발송 시간',
    body: '광고성 정보는 원칙적으로 오전 8시부터 오후 9시 사이에 보냅니다. 이 시간 밖에 보내려면 별도로 동의를 받습니다.',
  },
  {
    heading: '8. 동의 기록',
    body: '동의한 일시를 기록해 두며, 동의를 철회하면 철회한 사실도 기록합니다. 2년마다 수신 동의 여부를 다시 확인하여 안내드립니다.',
  },
];

export function MarketingConsentScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <BackButton onPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>마케팅 정보 수신 동의</Text>
        <Text style={styles.meta}>선택 동의 · 시행일자 [2026년 O월 O일]</Text>

        {SECTIONS.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}

        <Text style={styles.addendum}>시행일자 [2026년 O월 O일]</Text>
      </ScrollView>
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
    paddingBottom: space[10],
  },
  title: {
    ...textStyle({ size: 'display', weight: 'semibold', lineHeight: 'heading', letterSpacing: 'heading', color: color.ink.primary }),
    marginTop: space[9],
  },
  meta: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    marginTop: space[3],
  },
  section: {
    marginTop: space[9],
  },
  heading: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
    marginBottom: space[4],
  },
  body: {
    ...textStyle({ size: 'body', weight: 'regular', color: color.ink.label }),
    lineHeight: 15 * 1.6,
  },
  addendum: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    marginTop: space[10],
    paddingBottom: space[8],
  },
});
