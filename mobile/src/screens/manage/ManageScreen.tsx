import { getUnread } from '../../utils/unread';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useProjects } from '../../state/ProjectsContext';
import { attendingHeadcount, useGuestData } from '../../state/guestData';
import { ProjectStatusChip } from '../../components/ProjectStatusChip';
import { Toast } from '../../components/Toast';
import { DownloadSheet } from '../projectList/DownloadSheet';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { eventTypeMeta } from '../../types/project';
import { formatDday, formatEventDateTime, getProjectStatus } from '../../utils/projectStatus';
import { HeaderLink, ManageHeader, manageStyles } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Manage'>;

/** 통계 화면(StatsScreen)은 만들어 두었지만 지금은 관리 화면에 보이지 않아요. 나중에 쓰려면 true로. */
const SHOW_STATS = false;

/**
 * 관리 (E21) — 응답 · 방명록으로 가는 입구(숫자 카드)와 공유 · 데이터 내려받기 두 줄. 숫자는 있는 그대로(공유 전이면 0).
 * 같은 곳으로 가는 중복 메뉴(참석 응답 현황 · 방명록 관리 · QR · 홍보물 · 프로젝트 설정)는 없애서, 설정은 편집 화면의 ⚙ 초대장 설정 한 곳이에요.
 * 초대장 삭제는 내 초대장 목록의 카드에서만 해요.
 */
export function ManageScreen({ navigation, route }: Props) {
  const { getProject } = useProjects();
  const project = getProject(route.params.projectId);
  const { responses, posts, visits } = useGuestData(route.params.projectId);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!project) return <SafeAreaView style={manageStyles.screen} />;
  const projectId = project.id;
  const status = getProjectStatus(project);
  const typeName = project.eventType === 'other' ? project.customTypeName || '기타' : eventTypeMeta(project.eventType).label;
  const coming = attendingHeadcount(responses);
  const notComing = responses.filter((r) => !r.attending).length;

  const unread = getUnread(project);
  const kpis: { label: string; value: number; unit: string; sub: string; badge?: string; onPress: () => void }[] = [
    {
      label: '참석 예정',
      value: coming.total,
      unit: '명',
      sub: responses.length ? `불참 ${notComing} · 응답 ${responses.length}` : '동반 포함',
      badge: unread.rsvp > 0 ? `새 응답 ${unread.rsvp}` : undefined,
      onPress: () => navigation.navigate('ManageRsvp', { projectId }),
    },
    { label: '방명록', value: posts.length, unit: '개', sub: '', badge: unread.guestbook > 0 ? `새 방명록 ${unread.guestbook}` : undefined, onPress: () => navigation.navigate('ManageGuestbook', { projectId }) },
    // 통계는 지금은 감춰 둬요(SHOW_STATS) — 화면 · 경로는 그대로 두었고, 켜면 방문한 사람 카드와 메뉴가 다시 나와요.
    ...(SHOW_STATS
      ? [
          {
            label: '방문한 사람',
            value: visits.people,
            unit: '명',
            sub: visits.peopleToday ? `오늘 +${visits.peopleToday}` : '',
            onPress: () => navigation.navigate('ManageStats', { projectId }),
          },
        ]
      : []),
  ];

  const menu: { icon: string; label: string; sub?: string; onPress: () => void }[] = [
    { icon: '↗', label: '공유', sub: '링크 · 미리보기 · QR · 홍보물', onPress: () => navigation.navigate('Share', { projectId }) },
    { icon: '⬇', label: '데이터 내려받기', onPress: () => setDownloadOpen(true) },
  ];

  return (
    <SafeAreaView style={manageStyles.screen} edges={['top', 'bottom']}>
      <ManageHeader
        title="관리"
        onBack={() => navigation.goBack()}
        right={<HeaderLink label="편집하기" onPress={() => navigation.navigate('Editor', { projectId })} />}
      />
      <ScrollView contentContainerStyle={manageStyles.body}>
        <View style={styles.summary}>
          <View style={styles.summaryTop}>
            <ProjectStatusChip status={status} />
            <Text style={styles.dday}>{formatDday(project.eventAt)}</Text>
          </View>
          <Text style={styles.summaryTitle} numberOfLines={1}>
            {project.title}
          </Text>
          <Text style={styles.summarySub}>{`${typeName} · ${formatEventDateTime(project.eventAt)}`}</Text>
          {project.venue?.name ? <Text style={styles.summarySub}>{project.venue.name}</Text> : null}
        </View>

        <View style={styles.kpis}>
          {kpis.map((k) => (
            <Pressable key={k.label} onPress={k.onPress} style={styles.kpi}>
              <Text style={styles.kpiValue}>
                {k.value}
                <Text style={styles.kpiUnit}>{k.unit}</Text>
              </Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <Text style={styles.kpiSub} numberOfLines={1}>
                {k.sub || ' '}
              </Text>
              {k.badge ? (
                <View style={[styles.newPill, styles.kpiNew]}>
                  <Text style={styles.newPillText}>{k.badge}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>

        <View style={manageStyles.card}>
          {menu.map((m, i) => (
            <Pressable key={m.label} onPress={m.onPress} style={[styles.menuRow, i > 0 && manageStyles.divider]}>
              <Text style={styles.menuIcon}>{m.icon}</Text>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{m.label}</Text>
                {m.sub ? <Text style={styles.menuSub}>{m.sub}</Text> : null}
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <DownloadSheet
        visible={downloadOpen}
        project={project}
        onClose={() => setDownloadOpen(false)}
        onDownloaded={() => {
          setDownloadOpen(false);
          setToast('데이터를 내려받았어요');
        }}
      />
      <Toast visible={toast !== null} message={toast ?? ''} tone="success" onHide={() => setToast(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    padding: space[6],
    gap: space[2],
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    marginBottom: space[2],
  },
  dday: {
    ...textStyle({ size: 'small', weight: 'semibold', color: color.accent.base }),
  },
  summaryTitle: {
    ...textStyle({ size: 'title3', weight: 'semibold', color: color.ink.primary }),
  },
  summarySub: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  kpis: {
    flexDirection: 'row',
    gap: space[4],
  },
  kpi: {
    flex: 1,
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    paddingVertical: space[5],
    paddingHorizontal: space[5],
    gap: 2,
  },
  kpiValue: {
    ...textStyle({ size: 'title2', weight: 'semibold', color: color.ink.primary }),
    fontVariant: ['tabular-nums'],
  },
  kpiUnit: {
    ...textStyle({ size: 'small', weight: 'semibold', color: color.ink.primary }),
  },
  kpiLabel: {
    ...textStyle({ size: 'small', weight: 'semibold', color: color.ink.label }),
  },
  kpiSub: {
    ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.muted }),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingHorizontal: space[6],
    paddingVertical: space[6],
  },
  menuIcon: {
    width: 18,
    textAlign: 'center',
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.secondary }),
  },
  menuText: {
    flex: 1,
    gap: 2,
  },
  menuLabel: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.primary }),
  },
  menuSub: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  kpiNew: {
    alignSelf: 'flex-start',
    marginTop: space[3],
  },
  newPill: {
    backgroundColor: color.status.errorTint,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  newPillText: {
    ...textStyle({ size: 'caption', weight: 'semibold', color: color.status.error }),
  },
  chevron: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.placeholder }),
  },
});
