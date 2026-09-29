import { Pressable, Text, View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { Placeholder } from '../components/Placeholder';
import { StatusChip } from '../components/StatusChip';
import { color, radius, space } from '../theme/tokens';
import { textStyle, tnum } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Mock data — there's no backend yet, so the "current project" and its D-day
// are hard-coded to match the handoff screenshots until the editor (B) and
// project APIs exist.
const MOCK_PROJECT = {
  status: 'sharing' as 'sharing' | 'past',
  eventType: '결혼식',
  dDay: 142,
  title: '김지원 · 이민석',
  dateTime: '2026. 5. 16. 토 12:30',
  venue: '그랜드 하얏트 서울 3F',
};

// The editor (B), 관리 화면, and 내 초대장/마이 tabs aren't part of this
// handoff package yet — these are stubs until that navigation exists.
const notImplemented = () => {};

export function HomeScreen({ navigation }: Props) {
  const { auth } = useAuth();
  const hasProject = true;
  const userName = auth.user?.name ?? '게스트';

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Placeholder width={84} height={16} label="앱 이름" />
        <Pressable onPress={notImplemented}>
          <View style={styles.avatar} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.greeting}>
          {userName}님,{'\n'}행사까지 {MOCK_PROJECT.dDay}일 남았어요
        </Text>

        {hasProject ? (
          <View style={styles.projectCard}>
            <View style={styles.projectMain}>
              <View style={styles.thumb} />
              <View style={styles.projectInfo}>
                <View style={styles.metaRow}>
                  <StatusChip>{MOCK_PROJECT.status === 'sharing' ? '공유중' : '감사 페이지'}</StatusChip>
                  <Text style={styles.metaText}>{MOCK_PROJECT.eventType}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={[styles.metaText, tnum]}>D-{MOCK_PROJECT.dDay}</Text>
                </View>
                <Text style={styles.projectTitle}>{MOCK_PROJECT.title}</Text>
                <Text style={[styles.projectDetail, tnum]}>
                  {MOCK_PROJECT.dateTime}
                  {'\n'}
                  {MOCK_PROJECT.venue}
                </Text>
              </View>
            </View>
            <View style={styles.projectActions}>
              <Pressable style={styles.projectAction} onPress={notImplemented}>
                <Text style={styles.projectActionLabel}>편집</Text>
              </Pressable>
              <View style={styles.projectActionDivider} />
              <Pressable style={styles.projectAction} onPress={notImplemented}>
                <Text style={[styles.projectActionLabel, styles.projectActionAccent]}>관리</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>아직 만든 초대장이 없어요</Text>
          </View>
        )}

        <View style={styles.notifications}>
          <NotificationRow title="새 응답 3건" subtitle="RSVP · 방명록 1건" onPress={notImplemented} />
          <NotificationRow title="아직 비어 있는 블록 2개" subtitle="오시는 길 · 마음 전하기" onPress={notImplemented} />
        </View>
      </View>

      <View style={styles.tabBar}>
        <TabBarItem label="홈" active />
        <TabBarItem label="내 초대장" onPress={notImplemented} />
        <TabBarItem label="마이" inactive onPress={notImplemented} />
      </View>
    </View>
  );
}

function NotificationRow({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={styles.notificationRow} onPress={onPress}>
      <View style={styles.notificationText}>
        <Text style={styles.notificationTitle}>{title}</Text>
        <Text style={styles.notificationSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function TabBarItem({ label, active, inactive, onPress }: { label: string; active?: boolean; inactive?: boolean; onPress?: () => void }) {
  const color_ = active ? color.accent.base : inactive ? color.ink.inactive : color.ink.primary;
  return (
    <Pressable style={styles.tabBarItem} onPress={onPress}>
      <Text style={[styles.tabBarLabel, { color: color_ }, active && { fontFamily: 'Pretendard-SemiBold' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: space.screenX,
    paddingBottom: space[6],
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: radius.circle,
    backgroundColor: color.bg.placeholderFill,
    borderWidth: 1,
    borderColor: color.line.strong,
  },
  body: {
    flex: 1,
    paddingHorizontal: space.screenX,
  },
  greeting: {
    ...textStyle({ size: 'title1', weight: 'semibold', lineHeight: 'heading', color: color.ink.primary }),
  },
  projectCard: {
    marginTop: space[8],
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
  },
  projectMain: {
    flexDirection: 'row',
    gap: space[6],
    padding: space[7],
  },
  thumb: {
    width: 62,
    height: 78,
    borderRadius: 6,
    backgroundColor: color.accent.tint,
  },
  projectInfo: {
    flex: 1,
    gap: space[3],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  metaText: {
    ...textStyle({ size: 'caption', weight: 'medium', color: color.ink.secondary }),
  },
  metaDot: {
    color: color.line.strong,
  },
  projectTitle: {
    ...textStyle({ size: 'title3', weight: 'semibold', letterSpacing: 'title', color: color.ink.primary }),
  },
  projectDetail: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
    lineHeight: 11.5 * 1.5,
  },
  projectActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
  },
  projectAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space[6],
  },
  projectActionLabel: {
    ...textStyle({ size: 'body', weight: 'medium', color: color.ink.primary }),
  },
  projectActionAccent: {
    color: color.accent.base,
  },
  projectActionDivider: {
    width: 1,
    backgroundColor: color.line.soft,
  },
  emptyState: {
    marginTop: space[8],
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    padding: space[9],
    alignItems: 'center',
  },
  emptyStateText: {
    ...textStyle({ size: 'body', weight: 'regular', color: color.ink.muted }),
  },
  notifications: {
    marginTop: space[6],
    gap: space[4],
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: space[7],
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
  },
  notificationText: {
    gap: space[1],
  },
  notificationTitle: {
    ...textStyle({ size: 'body', weight: 'medium', color: color.ink.primary }),
  },
  notificationSubtitle: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  chevron: {
    color: color.ink.placeholder,
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: color.bg.tabbar,
    borderTopWidth: 1,
    borderTopColor: color.line.default,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },
  tabBarLabel: {
    ...textStyle({ size: 'small', weight: 'medium' }),
  },
});
