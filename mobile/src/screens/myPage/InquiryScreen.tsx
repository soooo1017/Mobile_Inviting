import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { BackButton } from '../../components/BackButton';
import { ScreenTitle } from '../../components/ScreenTitle';
import { FieldLabel } from '../../components/FieldLabel';
import { TextField } from '../../components/TextField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { BottomSheet } from '../../components/BottomSheet';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Inquiry'>;

type Tab = 'form' | 'history';

const TOPICS = ['이용 방법 문의', '오류·버그 신고', '디자인·테마 문의', '계정·로그인 문제', '기타'];

export function InquiryScreen({ route, navigation }: Props) {
  const [tab, setTab] = useState<Tab>(route.params?.tab ?? 'form');
  const [topic, setTopic] = useState<string | null>(null);
  const [topicSheetOpen, setTopicSheetOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const canSubmit = Boolean(topic) && title.trim().length > 0 && content.trim().length > 0;

  const handleAttach = () => {
    Alert.alert('파일 첨부', '준비 중이에요. 곧 지원할 예정이에요.');
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    Alert.alert(
      '문의 접수 준비 중이에요',
      '문의 접수 기능은 서비스 오픈 전에 확정해서 열어드릴게요. 급한 문의는 다른 채널로 연락해주세요.',
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <BackButton onPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <ScreenTitle>문의</ScreenTitle>

        <View style={styles.tabs}>
          <TabButton label="문의하기" active={tab === 'form'} onPress={() => setTab('form')} />
          <TabButton label="문의내역" active={tab === 'history'} onPress={() => setTab('history')} />
        </View>

        {tab === 'form' ? (
          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.field}>
              <FieldLabel>주제</FieldLabel>
              <Pressable onPress={() => setTopicSheetOpen(true)} style={styles.topicField}>
                <Text style={topic ? styles.topicValue : styles.topicPlaceholder}>
                  {topic ?? '주제를 선택해주세요'}
                </Text>
                <Text style={styles.chevronDown}>⌄</Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <FieldLabel>제목</FieldLabel>
              <TextField value={title} onChangeText={setTitle} placeholder="제목을 입력해주세요" />
            </View>

            <View style={styles.field}>
              <FieldLabel>문의 내용</FieldLabel>
              <TextField
                value={content}
                onChangeText={setContent}
                placeholder="문의하실 내용을 자세히 적어주세요"
                multiline
                style={styles.contentInput}
              />
            </View>

            <Pressable onPress={handleAttach} style={styles.attachButton}>
              <Text style={styles.attachLabel}>+ 파일 첨부</Text>
            </Pressable>

            <View style={styles.buttonWrap}>
              <PrimaryButton label="문의 보내기" onPress={handleSubmit} disabled={!canSubmit} />
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>아직 문의 내역이 없어요</Text>
            <Text style={styles.emptyBody}>문의를 보내면 답변 대기 / 답변 완료 상태로{'\n'}여기에서 확인할 수 있어요.</Text>
          </View>
        )}
      </View>

      <BottomSheet visible={topicSheetOpen} onClose={() => setTopicSheetOpen(false)} title="주제 선택">
        {TOPICS.map((t, i) => {
          const selected = t === topic;
          return (
            <Pressable
              key={t}
              onPress={() => {
                setTopic(t);
                setTopicSheetOpen(false);
              }}
              style={[styles.topicRow, i > 0 && styles.topicRowDivider]}
            >
              <Text style={[styles.topicRowLabel, selected && styles.topicRowLabelSelected]}>{t}</Text>
              {selected ? <Text style={styles.check}>✓</Text> : null}
            </Pressable>
          );
        })}
      </BottomSheet>
    </SafeAreaView>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  content: {
    flex: 1,
    paddingHorizontal: space.screenX,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: color.bg.segment,
    borderRadius: 10,
    padding: 3,
    gap: 3,
    marginTop: space[9],
  },
  tabButton: {
    flex: 1,
    paddingVertical: space[4],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: color.bg.surface,
  },
  tabLabel: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.muted }),
  },
  tabLabelActive: {
    color: color.ink.primary,
    fontFamily: 'Pretendard-SemiBold',
  },
  formScroll: {
    paddingTop: space[8],
    paddingBottom: space[10],
    gap: space[6],
  },
  field: {
    gap: 0,
  },
  topicField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.input,
    paddingHorizontal: space[6],
    paddingVertical: 13,
  },
  topicValue: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.primary }),
  },
  topicPlaceholder: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.placeholder }),
  },
  chevronDown: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.secondary }),
  },
  contentInput: {
    minHeight: 130,
    textAlignVertical: 'top',
  },
  attachButton: {
    alignSelf: 'flex-start',
    paddingVertical: space[3],
  },
  attachLabel: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.accent.base }),
  },
  buttonWrap: {
    marginTop: space[4],
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
    paddingVertical: space[7],
  },
  topicRowDivider: {
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
  },
  topicRowLabel: {
    ...textStyle({ size: 'control', weight: 'medium', color: color.ink.primary }),
  },
  topicRowLabelSelected: {
    color: color.accent.base,
    fontFamily: 'Pretendard-SemiBold',
  },
  check: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.accent.base }),
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[4],
    paddingBottom: space[10],
  },
  emptyTitle: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  emptyBody: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
    textAlign: 'center',
    lineHeight: 14 * 1.5,
  },
});
