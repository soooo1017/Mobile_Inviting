import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { BackButton } from '../../components/BackButton';
import { ScreenTitle } from '../../components/ScreenTitle';
import { FieldLabel } from '../../components/FieldLabel';
import { TextField } from '../../components/TextField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { BottomSheet } from '../../components/BottomSheet';
import { KeyboardAwareForm, useKeyboardAwareForm } from '../../components/KeyboardAwareForm';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../state/AuthContext';
import { Toast } from '../../components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'Inquiry'>;

type Tab = 'form' | 'history';

const TOPICS = ['이용 방법 문의', '오류·버그 신고', '디자인·테마 문의', '계정·로그인 문제', '기타'];

/** 보낸 문의 한 건 (supabase `inquiries` 표). 답변은 관리자가 대시보드에서 달아요. */
type Inquiry = { id: string; topic: string; title: string; content: string; status: 'pending' | 'answered'; reply: string | null; replied_at: string | null; created_at: string };

const fmtDay = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
};

export function InquiryScreen({ route, navigation }: Props) {
  const [tab, setTab] = useState<Tab>(route.params?.tab ?? 'form');
  const { scrollRef, fieldLayout, onFieldFocus } = useKeyboardAwareForm();
  const [topic, setTopic] = useState<string | null>(null);
  const [topicSheetOpen, setTopicSheetOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const canSubmit = Boolean(topic) && title.trim().length > 0 && content.trim().length > 0;

  const { auth } = useAuth();
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [items, setItems] = useState<Inquiry[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  // 문의내역 탭을 열 때마다 새로 불러와요 (답변이 달렸는지 보려고).
  useEffect(() => {
    if (tab !== 'history' || !auth.user) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('inquiries')
        .select('id, topic, title, content, status, reply, replied_at, created_at')
        .order('created_at', { ascending: false });
      if (!active) return;
      setLoadFailed(Boolean(error));
      setItems(error ? [] : ((data ?? []) as Inquiry[]));
    })();
    return () => {
      active = false;
    };
  }, [tab, auth.user]);

  const handleAttach = () => {
    Alert.alert('파일 첨부', '준비 중이에요. 곧 지원할 예정이에요.');
  };

  const handleSubmit = async () => {
    if (!canSubmit || sending || !auth.user || !topic) return;
    setSending(true);
    const { error } = await supabase.from('inquiries').insert({ user_id: auth.user.id, topic, title: title.trim(), content: content.trim() });
    setSending(false);
    if (error) {
      Alert.alert('문의를 보내지 못했어요', '인터넷 연결을 확인하고 다시 시도해주세요.');
      return;
    }
    setTopic(null);
    setTitle('');
    setContent('');
    setItems(null);
    setTab('history');
    setToast('문의를 보냈어요. 답변은 문의내역에서 확인할 수 있어요.');
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
          <KeyboardAwareForm scrollRef={scrollRef} contentContainerStyle={styles.formScroll}>
            <View style={styles.field}>
              <FieldLabel>주제</FieldLabel>
              <Pressable onPress={() => setTopicSheetOpen(true)} style={styles.topicField}>
                <Text style={topic ? styles.topicValue : styles.topicPlaceholder}>
                  {topic ?? '주제를 선택해주세요'}
                </Text>
                <Text style={styles.chevronDown}>⌄</Text>
              </Pressable>
            </View>

            <View style={styles.field} onLayout={fieldLayout('title')}>
              <FieldLabel>제목</FieldLabel>
              <TextField
                value={title}
                onChangeText={setTitle}
                onFocus={() => onFieldFocus('title')}
                placeholder="제목을 입력해주세요"
              />
            </View>

            <View style={styles.field} onLayout={fieldLayout('content')}>
              <FieldLabel>문의 내용</FieldLabel>
              <TextField
                value={content}
                onChangeText={setContent}
                onFocus={() => onFieldFocus('content')}
                placeholder="문의하실 내용을 자세히 적어주세요"
                multiline
                style={styles.contentInput}
              />
            </View>

            <Pressable onPress={handleAttach} style={styles.attachButton}>
              <Text style={styles.attachLabel}>+ 파일 첨부</Text>
            </Pressable>

            <View style={styles.buttonWrap}>
              <PrimaryButton label="문의 보내기" onPress={handleSubmit} disabled={!canSubmit} loading={sending} />
            </View>
          </KeyboardAwareForm>
        ) : items === null ? (
          <ActivityIndicator style={styles.loading} color={color.accent.base} />
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>{loadFailed ? '문의내역을 불러오지 못했어요' : '아직 문의 내역이 없어요'}</Text>
            <Text style={styles.emptyBody}>
              {loadFailed ? '인터넷 연결을 확인하고 다시 열어 주세요.' : '문의를 보내면 답변 대기 / 답변 완료 상태로\n여기에서 확인할 수 있어요.'}
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.historyList} showsVerticalScrollIndicator={false}>
            {items.map((it) => {
              const open = openId === it.id;
              const answered = it.status === 'answered';
              return (
                <Pressable key={it.id} onPress={() => setOpenId(open ? null : it.id)} style={styles.card}>
                  <View style={styles.cardHead}>
                    <View style={[styles.statusChip, answered ? styles.statusOn : styles.statusOff]}>
                      <Text style={[styles.statusLabel, answered && styles.statusLabelOn]}>{answered ? '답변 완료' : '답변 대기'}</Text>
                    </View>
                    <Text style={styles.cardTopic}>{it.topic}</Text>
                    <Text style={styles.cardDate}>{fmtDay(it.created_at)}</Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={open ? undefined : 1}>
                    {it.title}
                  </Text>
                  {open ? (
                    <>
                      <Text style={styles.cardBody}>{it.content}</Text>
                      {answered && it.reply ? (
                        <View style={styles.replyBox}>
                          <Text style={styles.replyHead}>{`답변${it.replied_at ? ` · ${fmtDay(it.replied_at)}` : ''}`}</Text>
                          <Text style={styles.replyBody}>{it.reply}</Text>
                        </View>
                      ) : (
                        <Text style={styles.waiting}>답변을 준비하고 있어요. 조금만 기다려 주세요.</Text>
                      )}
                    </>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      <Toast visible={toast !== null} message={toast ?? ''} tone="success" onHide={() => setToast(null)} />
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
  loading: {
    marginTop: space[10],
  },
  historyList: {
    paddingTop: space[8],
    paddingBottom: space[10],
    gap: space[4],
  },
  card: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    padding: space[6],
    gap: space[4],
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  statusChip: {
    borderRadius: radius.chip,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
  },
  statusOff: {
    borderColor: color.line.chip,
    backgroundColor: color.bg.surface,
  },
  statusOn: {
    borderColor: color.status.successBorder,
    backgroundColor: color.status.successTint,
  },
  statusLabel: {
    ...textStyle({ size: 'caption', weight: 'medium', color: color.ink.secondary }),
  },
  statusLabelOn: {
    color: color.status.success,
  },
  cardTopic: {
    flex: 1,
    ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.muted }),
  },
  cardDate: {
    ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.muted }),
  },
  cardTitle: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  cardBody: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.secondary }),
    lineHeight: 14 * 1.6,
  },
  replyBox: {
    backgroundColor: color.accent.tintSoft,
    borderRadius: 8,
    padding: space[5],
    gap: space[2],
  },
  replyHead: {
    ...textStyle({ size: 'small', weight: 'semibold', color: color.accent.base }),
  },
  replyBody: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.primary }),
    lineHeight: 14 * 1.6,
  },
  waiting: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
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
