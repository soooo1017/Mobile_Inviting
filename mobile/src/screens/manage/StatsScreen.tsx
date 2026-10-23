import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useProjects } from '../../state/ProjectsContext';
import { useGuestData } from '../../state/guestData';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { isShared, ManageHeader, manageStyles, NotShared } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageStats'>;

function shortDate(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

/**
 * 통계 (E25) — 방문한 사람(열어본 사람 수)을 기준으로, 열어본 횟수는 작게.
 * 응답률 = 참석 응답 수 ÷ 방문한 사람. 더 많은 지표는 넣지 않기로 함(2026-10-20).
 */
export function StatsScreen({ navigation, route }: Props) {
  const { getProject } = useProjects();
  const project = getProject(route.params.projectId);
  const { responses, visits } = useGuestData(route.params.projectId);

  if (!project) return <SafeAreaView style={manageStyles.screen} />;
  const rate = visits.people ? `${Math.round((responses.length / visits.people) * 100)}%` : '–';
  const max = Math.max(1, ...visits.daily);
  const days = visits.daily.length;

  return (
    <SafeAreaView style={manageStyles.screen} edges={['top', 'bottom']}>
      <ManageHeader title="통계" onBack={() => navigation.goBack()} />
      {!isShared(project) ? (
        <NotShared what="방문 기록이" onShare={() => navigation.navigate('Share', { projectId: project.id })} />
      ) : (
        <ScrollView contentContainerStyle={manageStyles.body}>
          <View style={styles.kpis}>
            <View style={styles.kpi}>
              <Text style={styles.kpiValue}>
                {visits.people}
                <Text style={styles.kpiUnit}>명</Text>
              </Text>
              <Text style={styles.kpiLabel}>방문한 사람</Text>
              <Text style={styles.kpiSub}>{`오늘 +${visits.peopleToday}\n열어본 횟수 ${visits.opens}번`}</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiValue}>{rate}</Text>
              <Text style={styles.kpiLabel}>응답률</Text>
              <Text style={styles.kpiSub}>{`방문 ${visits.people}명 중\n${responses.length}명 응답`}</Text>
            </View>
          </View>
          <Text style={styles.chartLabel}>최근 14일 방문한 사람</Text>
          <View style={styles.chart}>
            <View style={styles.bars}>
              {visits.daily.map((n, i) => (
                <View key={i} style={styles.barSlot}>
                  <View style={[styles.bar, { height: `${(n / max) * 100}%` }, i === days - 1 && styles.barToday]} />
                </View>
              ))}
            </View>
            <View style={styles.axis}>
              <Text style={styles.axisText}>{shortDate(days - 1)}</Text>
              <Text style={styles.axisText}>{shortDate(Math.floor(days / 2))}</Text>
              <Text style={styles.axisText}>오늘</Text>
            </View>
          </View>
          {visits.people === 0 ? <Text style={manageStyles.help}>아직 방문 기록이 없어요.</Text> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    padding: space[6],
    gap: 2,
  },
  kpiValue: {
    ...textStyle({ size: 'title1', weight: 'semibold', color: color.ink.primary }),
    fontVariant: ['tabular-nums'],
  },
  kpiUnit: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }),
  },
  kpiLabel: {
    ...textStyle({ size: 'small', weight: 'semibold', color: color.ink.label }),
  },
  kpiSub: {
    ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.muted }),
    lineHeight: 16,
    marginTop: 2,
  },
  chartLabel: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.label }),
  },
  chart: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    paddingHorizontal: space[5],
    paddingTop: space[6],
    paddingBottom: space[4],
    gap: space[3],
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 120,
    borderBottomWidth: 1,
    borderBottomColor: color.line.default,
  },
  barSlot: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    minHeight: 2,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: color.accent.tintBorder,
  },
  barToday: {
    backgroundColor: color.accent.base,
  },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisText: {
    ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.muted }),
  },
});
