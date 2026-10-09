import { Pressable, Text, View, StyleSheet } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { useProjects } from '../state/ProjectsContext';
import { Placeholder } from '../components/Placeholder';
import { StatusChip } from '../components/StatusChip';
import { color, radius, space } from '../theme/tokens';
import { textStyle, tnum } from '../theme/typography';
import { eventTypeMeta, STATUS_LABEL } from '../types/project';
import { dDayNumber, formatDday, formatEventDateTime, getProjectStatus } from '../utils/projectStatus';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

// 마이 화면, 알림 행 상세는 아직 설계되지 않은 영역이라 스텁으로 남겨둔다.
const notImplemented = () => {};

export function HomeScreen(_props: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { auth } = useAuth();
  const { projects } = useProjects();
  const userName = auth.user?.name ?? '게스트';

  const current = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )[0];
  const status = current ? getProjectStatus(current) : null;

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
          {userName}님,
          {'\n'}
          {current ? `행사까지 ${Math.max(dDayNumber(current.eventAt), 0)}일 남았어요` : '첫 초대장을 만들어보세요'}
        </Text>

        {current && status ? (
          <View style={styles.projectCard}>
            <View style={styles.projectMain}>
              <View style={styles.thumb} />
              <View style={styles.projectInfo}>
                <View style={styles.metaRow}>
                  <StatusChip>{STATUS_LABEL[status]}</StatusChip>
                  <Text style={styles.metaText}>{eventTypeMeta(current.eventType).label}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={[styles.metaText, tnum]}>{formatDday(current.eventAt)}</Text>
                </View>
                <Text style={styles.projectTitle}>{current.title}</Text>
                <Text style={[styles.projectDetail, tnum]}>
                  {formatEventDateTime(current.eventAt)}
                  {'\n'}
                  {current.venue?.name ?? ''}
                </Text>
              </View>
            </View>
            <View style={styles.projectActions}>
              <Pressable
                style={styles.projectAction}
                onPress={() => navigation.navigate('EditorPlaceholder', { projectId: current.id })}
              >
                <Text style={styles.projectActionLabel}>편집</Text>
              </Pressable>
              <View style={styles.projectActionDivider} />
              <Pressable
                style={styles.projectAction}
                onPress={() => navigation.navigate('ManagePlaceholder', { projectId: current.id })}
              >
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
    borderRadius: radius.cardHome,
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
});
