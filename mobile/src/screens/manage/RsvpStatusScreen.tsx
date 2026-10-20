import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useProjects } from '../../state/ProjectsContext';
import { useInvitation } from '../../state/InvitationsContext';
import { attendingHeadcount, useGuestData, type RsvpResponse } from '../../state/guestData';
import { BottomSheet } from '../../components/BottomSheet';
import { SelectChip } from '../../components/SelectChip';
import { DarkToast } from '../../editor/ui';
import { CallIcon, SmsIcon } from '../../editor/icons';
import { formatDeadline, fromDateKey, guestSides } from '../../editor/format';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { EmptyNote, Guide, isShared, ManageHeader, manageStyles, NotShared } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageRsvp'>;
type Filter = 'all' | 'yes' | 'no' | 'side0' | 'side1';

/** 응답 일시 : 2026년 10월 18일 오후 9:12 */
function formatAt(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Headcount a response stands for — the guest plus companions when coming. */
function heads(r: RsvpResponse) {
  return r.attending ? 1 + (r.companions ?? 0) : 1;
}

/** 참석 응답 현황 (E23) — 몇 명이 오는지를 가장 크게. 표의 칸은 참석 응답 설정에서 켜둔 항목만. */
export function RsvpStatusScreen({ navigation, route }: Props) {
  const { getProject } = useProjects();
  const project = getProject(route.params.projectId);
  const { invitation } = useInvitation(route.params.projectId);
  const { responses } = useGuestData(route.params.projectId);
  const [filter, setFilter] = useState<Filter>('all');
  const [detail, setDetail] = useState<RsvpResponse | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!project) return <SafeAreaView style={manageStyles.screen} />;
  const back = () => navigation.goBack();
  const block = invitation?.pages.invite.find((b) => b.type === 'rsvp');

  let body;
  if (!isShared(project)) {
    body = <NotShared what="참석 응답이" onShare={() => setToast('공유하기는 준비 중이에요')} />;
  } else if (!block || block.type !== 'rsvp') {
    body = (
      <Guide
        title="초대장에 참석 응답이 없어요"
        desc={'에디터에서 [+ 추가하기] › 참석 응답을 넣으면\n게스트 응답이 여기 모여요.'}
        action="에디터로 가기"
        onAction={() => navigation.navigate('Editor', { projectId: project.id })}
      />
    );
  } else {
    const f = block.props.fields;
    const sides = f.side ? guestSides(project) : [];
    const coming = attendingHeadcount(responses);
    const meals = responses.filter((r) => r.attending && r.meal).reduce((n, r) => n + heads(r), 0);
    const notComing = responses.filter((r) => !r.attending).length;
    const shown = responses.filter((r) =>
      filter === 'yes' ? r.attending : filter === 'no' ? !r.attending : filter === 'side0' ? r.side === 0 : filter === 'side1' ? r.side === 1 : true,
    );
    // The side bar follows the filter: headcount on each side among the rows shown.
    const sideCount = [0, 1].map((s) => shown.filter((r) => r.side === s).reduce((n, r) => n + heads(r), 0));
    const sideTotal = sideCount[0] + sideCount[1];
    const deadline = block.props.deadline;
    const daysLeft = deadline ? Math.ceil((fromDateKey(deadline).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000) : null;

    const chips: { key: Filter; label: string }[] = [
      { key: 'all', label: `전체 ${responses.length}` },
      { key: 'yes', label: `참석 ${responses.length - notComing}` },
      { key: 'no', label: `불참 ${notComing}` },
      ...(sides.length ? [{ key: 'side0' as Filter, label: sides[0] }, { key: 'side1' as Filter, label: sides[1] }] : []),
    ];

    body = (
      <>
        <ScrollView contentContainerStyle={manageStyles.body}>
          <View style={styles.hero}>
            <View style={styles.heroMain}>
              <Text style={styles.heroLabel}>참석 예정</Text>
              <Text style={styles.heroValue}>
                {coming.total}
                <Text style={styles.heroUnit}>명</Text>
              </Text>
              <Text style={styles.heroSub}>{`본인 ${coming.guests} · 동반 ${coming.companions}`}</Text>
            </View>
            <View style={styles.heroSide}>
              {f.meal ? <SideStat label="식사" value={meals} /> : null}
              <SideStat label="응답" value={responses.length} />
              <SideStat label="불참" value={notComing} />
            </View>
          </View>
          {deadline ? (
            <Text style={manageStyles.help}>
              {`${formatDeadline(deadline)} 자정까지 받아요 · ${daysLeft !== null && daysLeft >= 0 ? `마감 D-${daysLeft}` : '마감됐어요'}`}
            </Text>
          ) : null}
          <View style={manageStyles.chips}>
            {chips.map((c) => (
              <SelectChip key={c.key} label={c.label} selected={filter === c.key} onPress={() => setFilter(c.key)} />
            ))}
          </View>
          {sides.length && sideTotal > 0 ? (
            <View style={styles.split}>
              {sideCount[0] > 0 ? (
                <View style={[styles.splitPart, styles.split0, { flex: sideCount[0] }]}>
                  <Text style={[styles.splitText, styles.split0Text]} numberOfLines={1}>{`${sides[0]} ${sideCount[0]}명`}</Text>
                </View>
              ) : null}
              {sideCount[1] > 0 ? (
                <View style={[styles.splitPart, styles.split1, { flex: sideCount[1] }]}>
                  <Text style={[styles.splitText, styles.split1Text]} numberOfLines={1}>{`${sides[1]} ${sideCount[1]}명`}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={manageStyles.card}>
            <View style={[styles.tr, styles.th]}>
              {sides.length ? <Text style={[styles.thText, styles.cSide]}>구분</Text> : null}
              <Text style={[styles.thText, styles.cName]}>이름</Text>
              <Text style={[styles.thText, styles.cAtt]}>참석</Text>
              {f.companions ? <Text style={[styles.thText, styles.cNum]}>동반</Text> : null}
              {f.meal ? <Text style={[styles.thText, styles.cNum]}>식사</Text> : null}
            </View>
            {shown.length ? (
              shown.map((r) => (
                <Pressable key={r.id} onPress={() => setDetail(r)} style={[styles.tr, manageStyles.divider]}>
                  {sides.length ? (
                    <View style={styles.cSide}>
                      {r.side !== undefined ? <SideTag side={r.side} label={sides[r.side]} /> : <Text style={styles.td}>–</Text>}
                    </View>
                  ) : null}
                  <Text style={[styles.td, styles.cName, styles.tdName]} numberOfLines={1}>
                    {r.name}
                  </Text>
                  <Text style={[styles.td, styles.cAtt, !r.attending && styles.tdMuted]}>{r.attending ? '참석' : '불참'}</Text>
                  {f.companions ? <Text style={[styles.td, styles.cNum]}>{r.attending && r.companions ? r.companions : '–'}</Text> : null}
                  {f.meal ? <Text style={[styles.td, styles.cNum]}>{r.attending ? (r.meal ? 'O' : 'X') : '–'}</Text> : null}
                </Pressable>
              ))
            ) : (
              <EmptyNote text={responses.length ? '조건에 맞는 응답이 없어요' : '아직 받은 응답이 없어요'} />
            )}
          </View>
        </ScrollView>
        <View style={manageStyles.footer}>
          <Pressable
            disabled={!responses.length}
            onPress={() => setToast('엑셀 내려받기는 준비 중이에요')}
            style={[manageStyles.outlineBtn, !responses.length && manageStyles.off]}
          >
            <Text style={manageStyles.outlineBtnLabel}>엑셀로 내려받기</Text>
          </Pressable>
        </View>
        <BottomSheet visible={detail !== null} onClose={() => setDetail(null)} title={detail?.name ?? ''}>
          {detail ? <ResponseDetail response={detail} fields={f} sides={sides} /> : null}
        </BottomSheet>
      </>
    );
  }

  return (
    <SafeAreaView style={manageStyles.screen} edges={['top', 'bottom']}>
      <ManageHeader title="참석 응답 현황" onBack={back} />
      {body}
      <DarkToast message={toast} onHide={() => setToast(null)} bottom={90} />
    </SafeAreaView>
  );
}

function SideStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.sideStat}>
      <Text style={styles.sideStatLabel}>{label}</Text>
      <Text style={styles.sideStatValue}>{value}</Text>
    </View>
  );
}

export function SideTag({ side, label }: { side: 0 | 1; label: string }) {
  return (
    <View style={[styles.tag, side === 0 ? styles.split0 : styles.split1]}>
      <Text style={[styles.tagText, side === 0 ? styles.split0Text : styles.split1Text]}>{label}</Text>
    </View>
  );
}

function ResponseDetail({
  response: r,
  fields: f,
  sides,
}: {
  response: RsvpResponse;
  fields: { side: boolean; companions: boolean; meal: boolean; phone: boolean; message: boolean };
  sides: string[];
}) {
  const rows: [string, string][] = [['참석 여부', r.attending ? '참석' : '불참']];
  if (f.side && r.side !== undefined) rows.push(['어느 쪽 손님', sides[r.side] ?? '']);
  if (f.companions && r.attending) rows.push(['동반 인원', r.companions ? `${r.companions}명` : '없음']);
  if (f.meal && r.attending) rows.push(['식사', r.meal ? 'O' : 'X']);
  const digits = r.phone?.replace(/\D/g, '') ?? '';
  return (
    <View style={styles.detail}>
      <View style={manageStyles.card}>
        {rows.map(([k, v], i) => (
          <View key={k} style={[styles.detailRow, i > 0 && manageStyles.divider]}>
            <Text style={styles.detailKey}>{k}</Text>
            <Text style={styles.detailValue}>{v}</Text>
          </View>
        ))}
        {f.phone && r.phone ? (
          <View style={[styles.detailRow, manageStyles.divider]}>
            <Text style={styles.detailKey}>연락처</Text>
            <Text style={styles.detailValue}>{r.phone}</Text>
            <Pressable onPress={() => Linking.openURL(`tel:${digits}`)} style={styles.circle} accessibilityLabel="전화">
              <CallIcon color={color.ink.secondary} />
            </Pressable>
            <Pressable onPress={() => Linking.openURL(`sms:${digits}`)} style={styles.circle} accessibilityLabel="문자">
              <SmsIcon color={color.ink.secondary} />
            </Pressable>
          </View>
        ) : null}
      </View>
      {f.message && r.message ? (
        <View style={styles.messageWrap}>
          <Text style={styles.detailKey}>전할 말</Text>
          <View style={styles.message}>
            <Text style={styles.messageText}>{r.message}</Text>
          </View>
        </View>
      ) : null}
      <Text style={manageStyles.help}>{`응답 일시 : ${formatAt(r.at)}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    gap: space[4],
  },
  heroMain: {
    flex: 1.3,
    backgroundColor: color.accent.tint,
    borderWidth: 1,
    borderColor: color.accent.tintBorder,
    borderRadius: radius.card,
    padding: space[6],
    gap: 2,
  },
  heroLabel: {
    ...textStyle({ size: 'small', weight: 'semibold', color: color.accent.base }),
  },
  heroValue: {
    ...textStyle({ size: 'title1', weight: 'semibold', color: color.ink.primary }),
    fontVariant: ['tabular-nums'],
  },
  heroUnit: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }),
  },
  heroSub: {
    ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.secondary }),
  },
  heroSide: {
    flex: 1,
    gap: space[3],
  },
  sideStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.input,
    paddingHorizontal: space[5],
  },
  sideStatLabel: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  sideStatValue: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
    fontVariant: ['tabular-nums'],
  },
  split: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 6,
    overflow: 'hidden',
  },
  splitPart: {
    justifyContent: 'center',
    paddingHorizontal: space[4],
  },
  split0: {
    backgroundColor: '#e3e9df',
  },
  split1: {
    backgroundColor: '#f3e0e3',
  },
  splitText: {
    ...textStyle({ size: 'caption', weight: 'semibold' }),
  },
  split0Text: {
    color: '#4f6b45',
  },
  split1Text: {
    color: '#8a4d5a',
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[5],
    paddingVertical: space[5],
  },
  th: {
    backgroundColor: color.bg.canvas,
    paddingVertical: space[4],
  },
  thText: {
    ...textStyle({ size: 'caption', weight: 'semibold', color: color.ink.muted }),
  },
  td: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.primary }),
  },
  tdName: {
    fontFamily: 'Pretendard-SemiBold',
  },
  tdMuted: {
    color: color.ink.placeholder,
  },
  cSide: {
    width: 58,
  },
  cName: {
    flex: 1,
  },
  cAtt: {
    width: 36,
    textAlign: 'center',
  },
  cNum: {
    width: 34,
    textAlign: 'center',
  },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: {
    ...textStyle({ size: 'caption', weight: 'semibold' }),
  },
  detail: {
    paddingHorizontal: space.screenX,
    paddingBottom: space[6],
    gap: space[6],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    paddingHorizontal: space[6],
    paddingVertical: space[5],
  },
  detailKey: {
    flex: 1,
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.secondary }),
  },
  detailValue: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }),
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: color.line.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageWrap: {
    gap: space[3],
  },
  message: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.input,
    padding: space[5],
  },
  messageText: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.primary }),
    lineHeight: 21,
  },
});
