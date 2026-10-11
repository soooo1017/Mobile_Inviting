import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { BackButton } from '../../components/BackButton';
import { color, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Terms'>;

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '제1조 (목적)',
    body: '이 약관은 [서비스명](이하 "회사")이 제공하는 모바일 초대장 제작 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리·의무 및 책임사항, 기타 필요한 사항을 정함을 목적으로 합니다.',
  },
  {
    heading: '제2조 (정의)',
    body: '① "서비스"란 회원이 모바일 애플리케이션을 통해 초대장을 제작·공유하고, 참석 여부 응답(RSVP)·방명록 등 부가 기능을 이용할 수 있도록 회사가 제공하는 일체의 서비스를 말합니다.\n② "회원"이란 이 약관에 동의하고 아이디를 발급받아 서비스를 이용하는 자를 말합니다.\n③ "아이디"란 회원 식별과 서비스 이용을 위해 회원이 정하고 회사가 승인한 문자·숫자의 조합을 말합니다.\n④ "콘텐츠"란 회원이 서비스 내에서 작성·업로드하는 초대장 문구, 사진, 방명록 게시물 등 일체의 정보를 말합니다.',
  },
  {
    heading: '제3조 (약관의 효력 및 변경)',
    body: '① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써 효력이 발생합니다.\n② 회사는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 적용일자 7일 전(회원에게 불리한 변경은 30일 전)부터 공지합니다.\n③ 회원이 개정 약관의 적용일 이후에도 서비스를 계속 이용하면 개정 약관에 동의한 것으로 봅니다.',
  },
  {
    heading: '제4조 (서비스의 제공 및 변경)',
    body: '회사는 초대장 제작·편집·공유, RSVP 수집·조회, 방명록 등록·조회 및 회사가 추가로 제공하는 서비스를 제공하며, 서비스 내용 변경 시 사전에 공지합니다.',
  },
  {
    heading: '제5조 (서비스 이용시간)',
    body: '서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 하되, 시스템 점검 등 필요한 경우 일시 중단될 수 있습니다.',
  },
  {
    heading: '제6조 (회원가입)',
    body: '① 회원가입은 이용자가 약관에 동의하고 아이디·닉네임·이메일·비밀번호 등 회사가 정한 정보를 입력하여 신청합니다.\n② 타인의 명의 이용, 허위 정보 기재 등의 경우 회사는 가입을 거부하거나 사후 취소할 수 있습니다.\n③ 회원가입은 등록한 이메일로 발송되는 인증 절차를 완료함으로써 완료됩니다.',
  },
  {
    heading: '제7조 (회원 탈퇴 및 자격 상실)',
    body: '① 회원은 마이페이지의 "회원 탈퇴" 메뉴를 통해 언제든지 탈퇴할 수 있습니다.\n② 탈퇴 시 해당 회원이 작성한 콘텐츠는 원칙적으로 삭제됩니다. 다만 다른 이용자가 작성한 게시물(방명록 등)은 삭제되지 않을 수 있습니다.',
  },
  {
    heading: '제8조 (회원에 대한 통지)',
    body: '회사는 회원이 가입 시 등록한 이메일 주소 또는 서비스 내 알림을 통해 통지할 수 있습니다.',
  },
  {
    heading: '제9조 (개인정보의 보호)',
    body: '회사는 관련 법령에 따라 회원의 개인정보를 보호하며, 구체적인 사항은 별도의 개인정보처리방침에 따릅니다.',
  },
  {
    heading: '제10조 (회사의 의무)',
    body: '회사는 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 계속적·안정적인 서비스 제공과 개인정보 보호를 위한 보안체계 마련에 노력합니다.',
  },
  {
    heading: '제11조 (회원의 의무)',
    body: '회원은 타인 정보 도용, 허위 내용 등록, 회사의 사전 승낙 없는 콘텐츠의 영리적 복제·유통, 타인의 명예 훼손, 공서양속에 반하는 게시 등의 행위를 하여서는 안 됩니다.',
  },
  {
    heading: '제12조 (콘텐츠의 저작권 및 이용)',
    body: '① 회원이 작성한 콘텐츠의 저작권은 해당 회원에게 귀속됩니다.\n② 회원은 회사가 서비스 운영·전시·홍보 목적으로 해당 콘텐츠를 사용(복제·전송·배포)하는 것을 허락하며, 영리적 목적의 사용에는 사전 동의를 받습니다.',
  },
  {
    heading: '제13조 (서비스 이용의 제한 및 중지)',
    body: '회사는 회원이 이 약관을 위반하거나 서비스 운영을 방해한 경우 경고·일시정지·영구이용정지 등 단계적으로 이용을 제한할 수 있습니다.',
  },
  {
    heading: '제14조 (손해배상)',
    body: '회사는 무료로 제공하는 서비스와 관련하여 고의 또는 중대한 과실이 없는 한 회원에게 발생한 손해에 책임을 지지 않습니다.',
  },
  {
    heading: '제15조 (면책조항)',
    body: '① 천재지변 등 불가항력으로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.\n② 회사는 회원 간 또는 회원과 제3자 간에 서비스를 매개로 발생한 분쟁에 개입할 의무가 없으며, 이로 인한 손해를 배상할 책임이 없습니다.\n③ 회사는 회원이 게재한 콘텐츠의 신뢰도·정확성에 대해 책임을 지지 않습니다.',
  },
  {
    heading: '제16조 (분쟁해결)',
    body: '회사는 회원의 불만 및 의견을 신속·공정하게 처리하기 위해 노력하며, 처리가 곤란한 경우 사유와 처리 일정을 안내합니다.',
  },
  {
    heading: '제17조 (재판권 및 준거법)',
    body: '이 약관과 관련한 분쟁에는 대한민국 법을 적용하며, 회사의 본사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.',
  },
];

export function TermsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <BackButton onPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>이용약관</Text>
        <Text style={styles.meta}>시행일자 [2026년 O월 O일]</Text>

        {SECTIONS.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}

        <Text style={styles.addendum}>부칙 — 이 약관은 [2026년 O월 O일]부터 적용됩니다.</Text>
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
