import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { BackButton } from '../../components/BackButton';
import { color, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. 수집하는 개인정보 항목 및 수집 방법',
    body: '· 회원가입 시: 아이디, 닉네임, 이메일 주소, 비밀번호(암호화 저장)\n· 서비스 이용 중: 초대장·행사 정보, RSVP 응답 정보(응답자 이름, 참석 여부, 인원, 메시지 등 회원이 직접 수집하는 게스트 정보), 방명록 작성 내용\n· 자동 수집: 접속 로그, 기기·OS·앱 버전 정보, 서비스 이용기록\n· 초대장 방문 통계: 게스트가 초대장 링크를 열 때 방문한 사람 수·열어본 횟수를 집계합니다. 개인을 알아볼 수 있는 정보는 기록하지 않으며, 같은 기기·브라우저인지만 구분하는 익명 숫자로만 다룹니다.\n· 안내 팝업 설정: 게스트가 “오늘 하루 보지 않기”를 선택하면 그 선택을 게스트의 기기(브라우저)에 임시로 저장하며, 당일 자정이 지나면 더 이상 사용하지 않습니다. 서버로 전송하거나 개인을 알아보는 데 쓰지 않습니다.\n· 회원가입 및 서비스 이용 과정에서 이용자가 직접 입력하거나, 이용 중 자동으로 생성·수집됩니다.',
  },
  {
    heading: '2. 개인정보의 수집 및 이용 목적',
    body: '회원 식별·본인확인 및 부정이용 방지, 초대장 제작·공유 및 RSVP·방명록 기능 제공, 초대장을 만든 회원에게 방문 통계 제공, 공지사항 전달 및 고객 문의 응대, (동의 시) 이벤트·마케팅 정보 안내를 위해 이용합니다.',
  },
  {
    heading: '3. 개인정보의 보유 및 이용 기간',
    body: '회원 탈퇴 시까지 보유하며 탈퇴 시 지체 없이 파기합니다. 다만 관련 법령에 따라 보존이 필요한 경우 해당 기간 보관합니다(전자상거래법상 계약·청약철회 기록 5년, 통신비밀보호법상 로그인 기록 3개월 등). 게스트가 입력한 RSVP·방명록 정보는 초대장 삭제 또는 작성 회원 탈퇴 시 함께 삭제됩니다. 초대장·행사 정보와 RSVP·방명록은 행사일로부터 1년간 보관한 뒤 자동으로 삭제합니다.',
  },
  {
    heading: '4. 개인정보의 파기 절차 및 방법',
    body: '보유기간 경과 또는 처리목적 달성 시 지체 없이 파기합니다. 전자적 파일은 복구 불가능한 방법으로 영구 삭제하며, 서면은 분쇄·소각합니다.',
  },
  {
    heading: '5. 개인정보의 제3자 제공',
    body: '회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 이용자가 사전에 동의하였거나 법령에 근거하거나 수사기관의 적법한 요청이 있는 경우는 예외로 합니다.',
  },
  {
    heading: '6. 개인정보 처리의 위탁',
    body: '서비스 운영을 위해 아래와 같이 개인정보 처리를 위탁하고 있습니다.\n· 수탁업체: Supabase(회원 인증 및 데이터베이스 호스팅)\n회사는 위탁계약 체결 시 개인정보보호법 제26조에 따라 수탁자가 개인정보를 안전하게 처리하도록 관리·감독합니다.',
  },
  {
    heading: '7. 정보주체의 권리·의무 및 행사 방법',
    body: '이용자는 마이페이지에서 언제든지 본인의 개인정보를 조회·수정할 수 있으며, 회원 탈퇴를 통해 삭제를 요청할 수 있습니다. 개인정보 보호책임자에게 서면·이메일 등으로 열람·정정·삭제·처리정지를 요구할 수도 있습니다.',
  },
  {
    heading: '8. 개인정보의 안전성 확보 조치',
    body: '비밀번호 암호화 저장, 전송구간 암호화(TLS), 개인정보 접근권한 최소화 및 접근기록 관리, 개인정보 취급 담당자 최소화 및 교육을 시행합니다.',
  },
  {
    heading: '9. 개인정보 보호책임자',
    body: '성명: [담당자명] · 연락처: [이메일/전화번호]\n이용자는 서비스 이용 중 발생한 개인정보 관련 문의·불만을 개인정보 보호책임자에게 문의할 수 있습니다.',
  },
  {
    heading: '10. 권익침해 구제방법',
    body: '개인정보 침해로 인한 신고·상담이 필요한 경우 아래 기관에 문의할 수 있습니다.\n· 개인정보보호위원회(privacy.go.kr / 국번없이 182)\n· 개인정보침해신고센터(privacy.kisa.or.kr / 국번없이 118)\n· 대검찰청 사이버수사과(spo.go.kr / 국번없이 1301)\n· 경찰청 사이버수사국(ecrm.cyber.go.kr / 국번없이 182)',
  },
  {
    heading: '11. 고지의 의무',
    body: '이 방침은 법령·정책 변경에 따라 내용이 추가·삭제·수정될 수 있으며, 변경 시 서비스 공지사항을 통해 고지합니다.',
  },
];

export function PrivacyPolicyScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <BackButton onPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>개인정보처리방침</Text>
        <Text style={styles.meta}>공고일자 [2026년 O월 O일] · 시행일자 [2026년 O월 O일]</Text>

        <Text style={styles.intro}>
          [서비스명](이하 &ldquo;회사&rdquo;)은 개인정보보호법 등 관련 법령을 준수하며, 이용자의 개인정보를 안전하게 보호하기 위해 다음과
          같이 개인정보처리방침을 수립·공개합니다.
        </Text>

        {SECTIONS.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}

        <Text style={styles.addendum}>공고일자 [2026년 O월 O일] · 시행일자 [2026년 O월 O일]</Text>
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
  intro: {
    ...textStyle({ size: 'body', weight: 'regular', color: color.ink.label }),
    lineHeight: 15 * 1.6,
    marginTop: space[8],
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
