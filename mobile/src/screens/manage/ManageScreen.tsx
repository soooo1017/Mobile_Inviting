import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useProjects } from '../../state/ProjectsContext';
import { attendingHeadcount, useGuestData } from '../../state/guestData';
import { ProjectStatusChip } from '../../components/ProjectStatusChip';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { eventTypeMeta } from '../../types/project';
import { formatDday, formatEventDateTime, getProjectStatus } from '../../utils/projectStatus';
import { HeaderLink, ManageHeader, manageStyles } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Manage'>;

/** 통계 화면(StatsScreen)은 만들어 두었지만 지금은 관리 화면에 보이지 않아요. 나중에 쓰려면 true로. */
const SHOW_STATS = false;

/** 관리 (E21) — 응답 · 방명록 · 통계 · 공유 · 설정으로 가는 첫 화면. 숫자는 있는 그대로(공유 전이면 0). */
export function ManageScreen({ navigation, route }: Props) {
  const { getProject } = useProjects();
  const project = getProject(route.params.projectId);
  const { responses, posts, visits } = useGuestData(route.params.projectId);

  if (!project) return <SafeAreaView style={manageStyles.screen} />;
  const projectId = project.id;
  const status = getProjectStatus(project);
  const typeName = project.eventType === 'other' ? project.customTypeName || '기타' : eventTypeMeta(project.eventType).label;
  const coming = attendingHeadcount(responses);
  const notComing = responses.filter((r) => !r.attending).length;

  const kpis: { label: string; value: number; unit: string; sub: string; onPress: () => void }[] = [
    {
      label: '참석 예정',
      value: coming.total,
      unit: '명',
      sub: responses.length ? `불참 ${notComing} · 응답 ${responses.length}` : '동반 포함',
      onPress: () => navigation.navigate('ManageRsvp', { projectId }),
    },
    { label: '방명록', value: posts.length, unit: '개', sub: '', onPress: () => navigation.navigate('ManageGuestbook', { projectId }) },
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

  const menu: { icon: string; label: string; value?: string; onPress: () => void }[] = [
    { icon: '✓', label: '참석 응답 현황', onPress: () => navigation.navigate('ManageRsvp', { projectId }) },
    { icon: '✎', label: '방명록 관리', onPress: () => navigation.navigate('ManageGuestbook', { projectId }) },
    ...(SHOW_STATS ? [{ icon: '▥', label: '통계', onPress: () => navigation.navigate('ManageStats', { projectId }) }] : []),
    { icon: '↗', label: '공유하기', onPress: () => navigation.navigate('Share', { projectId }) },
    { icon: '▦', label: 'QR 코드', onPress: () => navigation.navigate('Qr', { projectId }) },
    { icon: '▤', label: '홍보물 만들기', onPress: () => navigation.navigate('Poster', { projectId }) },
    { icon: '⚙', label: '프로젝트 설정', onPress: () => navigation.navigate('ProjectSettings', { projectId }) },
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
            </Pressable>
          ))}
        </View>

        <View style={manageStyles.card}>
          {menu.map((m, i) => (
            <Pressable key={m.label} onPress={m.onPress} style={[styles.menuRow, i > 0 && manageStyles.divider]}>
              <Text style={styles.menuIcon}>{m.icon}</Text>
              <Text style={styles.menuLabel}>{m.label}</Text>
              <Text style={m.value ? styles.menuValue : styles.chevron}>{m.value ?? '›'}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
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
  menuLabel: {
    flex: 1,
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.primary }),
  },
  menuValue: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  chevron: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.placeholder }),
  },
});
