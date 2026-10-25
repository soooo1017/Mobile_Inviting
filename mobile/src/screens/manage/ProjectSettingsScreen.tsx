import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useProjects } from '../../state/ProjectsContext';
import { useInvitation } from '../../state/InvitationsContext';
import { BottomSheet } from '../../components/BottomSheet';
import { SelectChip } from '../../components/SelectChip';
import { TextField } from '../../components/TextField';
import { Toast } from '../../components/Toast';
import { EventInfoRows } from '../../editor/EventInfoRows';
import { VenueFields } from '../../editor/VenueFields';
import { useThanksMode } from '../../editor/thanksMode';
import { Help, Section, SelectRow, ToggleList } from '../../editor/ui';
import { PopupStartPicker } from '../../editor/PopupStartPicker';
import { popupStartDays } from '../../editor/types';
import { ShareControl } from '../share/ShareControl';
import { DeleteDialog } from '../projectList/DeleteDialog';
import { DownloadSheet } from '../projectList/DownloadSheet';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { formatMonthDay, thanksEndDate, thanksStartDate } from '../../utils/projectStatus';
import type { Project, ThanksSettings } from '../../types/project';
import { ManageHeader, manageStyles } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'ProjectSettings'>;

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

/**
 * 프로젝트 설정 (E22) — 초대장의 운영(이름 · 행사 정보 · 감사페이지 · 내려받기 · 삭제).
 * 모양(글꼴 · 대표 사진 · 테마 · 배경음악)은 에디터 ⚙ 전체 설정에. 행사 정보는 두 곳이 같은 값.
 * 감사페이지 규칙은 새 초대장 3/4와 같아요: 행사 다음 날 자정부터 공개 기간(1~7일) 동안.
 */
export function ProjectSettingsScreen({ navigation, route }: Props) {
  const { getProject } = useProjects();
  const project = getProject(route.params.projectId);
  if (!project) return <SafeAreaView style={manageStyles.screen} />;
  return <Settings project={project} navigation={navigation} />;
}

function Settings({ project, navigation }: { project: Project; navigation: Props['navigation'] }) {
  const { updateProject, setThanksSettings, deleteProject } = useProjects();
  const thanksMode = useThanksMode(project);
  const { invitation, setPopupEnabled, setPopupStart } = useInvitation(project.id);
  const popupOn = invitation?.popup?.enabled ?? false;
  const [title, setTitle] = useState(project.title);
  const [venueOpen, setVenueOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const thanks = project.thanks;
  const days = thanks.days ?? 7;
  const start = thanksStartDate(new Date(project.eventAt));
  const period = `${formatMonthDay(start.toISOString())} ~ ${formatMonthDay(thanksEndDate(start, days).toISOString())} (${days}일)`;
  const setThanks = (patch: Partial<ThanksSettings>) => setThanksSettings(project.id, { ...thanks, ...patch });

  const commitTitle = () => {
    const next = title.trim();
    if (next && next !== project.title) updateProject(project.id, { title: next });
    else setTitle(project.title);
  };

  return (
    <SafeAreaView style={manageStyles.screen} edges={['top', 'bottom']}>
      <ManageHeader title="프로젝트 설정" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[manageStyles.body, styles.body]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <Section label="공유">
          <ShareControl
            project={project}
            onChange={(shared) => {
              updateProject(project.id, { shared });
              setToast(shared ? '공유를 시작했어요 · 게스트 화면은 서버 연결 뒤에 열려요' : '공유를 중지했어요');
            }}
          />
        </Section>
        <Section label="초대장 이름" sub="내 초대장 목록에 보여요">
          <TextField value={title} onChangeText={setTitle} onBlur={commitTitle} onSubmitEditing={commitTitle} maxLength={30} returnKeyType="done" />
        </Section>

        <Section label="행사 정보" sub="에디터의 ⚙ 전체 설정과 같이 바뀌어요">
          <EventInfoRows project={project} onEventAt={(eventAt) => updateProject(project.id, { eventAt })} onOpenVenue={() => setVenueOpen(true)} />
        </Section>

        <Section label="안내 팝업">
          <ToggleList items={[{ key: 'popup', label: '안내 팝업 사용', value: popupOn, onChange: setPopupEnabled }]} />
          {popupOn ? <PopupStartPicker eventAt={project.eventAt} value={popupStartDays(invitation?.popup)} onChange={setPopupStart} /> : null}
          {popupOn ? <SelectRow label="내용 편집" onPress={() => navigation.navigate('Editor', { projectId: project.id, tab: 'popup' })} /> : null}
          <Help>에디터 ⚙ 전체 설정과 같은 설정이에요.</Help>
        </Section>

        <Section label="감사페이지">
          <ToggleList
            items={[
              {
                key: 'thanks',
                label: '감사페이지 사용',
                value: thanks.enabled,
                onChange: (enabled) => setThanks({ enabled, days: thanks.days ?? 7 }),
              },
            ]}
          />
          {thanks.enabled ? (
            <View style={styles.thanksBox}>
              <View style={styles.modeRow}>
                <Text style={styles.rowLabel}>방식</Text>
                <View style={manageStyles.chips}>
                  <SelectChip label="간단하게" selected={thanksMode.mode === 'simple'} onPress={() => thanksMode.switchTo('simple')} />
                  <SelectChip label="자유롭게" selected={thanksMode.mode === 'free'} onPress={() => thanksMode.switchTo('free')} />
                </View>
              </View>
              <View style={styles.periodHead}>
                <Text style={styles.rowLabel}>공개 기간</Text>
                <Text style={manageStyles.help}>최소 1일 ~ 최대 7일</Text>
              </View>
              <View style={styles.dayRow}>
                {DAYS.map((d) => (
                  <View key={d} style={styles.dayCell}>
                    <SelectChip label={`${d}일`} shape="cell" selected={days === d} onPress={() => setThanks({ days: d })} />
                  </View>
                ))}
              </View>
              <View style={styles.period}>
                <Text style={styles.periodText}>{`기간 : ${period}`}</Text>
              </View>
            </View>
          ) : null}
          <Help>
            {thanks.enabled
              ? '행사 다음 날 자정부터 공유한 링크가 감사페이지로 바뀌어요.'
              : '행사가 끝나도 같은 링크에서 초대장이 계속 보여요. 만들어 둔 감사페이지는 그대로 보관돼서, 다시 켜면 이어서 쓸 수 있어요.'}
          </Help>
        </Section>

        <SelectRow label="데이터 내려받기" onPress={() => setDownloadOpen(true)} />
        <Pressable onPress={() => setDeleteOpen(true)} style={styles.delete}>
          <Text style={styles.deleteLabel}>초대장 삭제하기</Text>
        </Pressable>
      </ScrollView>

      <BottomSheet visible={venueOpen} onClose={() => setVenueOpen(false)} title="장소">
        <View style={styles.venueSheet}>
          <VenueFields project={project} onVenue={(venue) => updateProject(project.id, { venue })} />
          <Help>초대장의 장소 칸과 에디터 ⚙ 전체 설정에 같이 반영돼요.</Help>
        </View>
      </BottomSheet>
      <DownloadSheet
        visible={downloadOpen}
        project={project}
        onClose={() => setDownloadOpen(false)}
        onDownloaded={() => {
          setDownloadOpen(false);
          setToast('데이터를 내려받았어요');
        }}
      />
      <DeleteDialog
        visible={deleteOpen}
        project={project}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          deleteProject(project.id);
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
        }}
        onDataDownloaded={() => setToast('데이터를 내려받았어요')}
      />
      {thanksMode.dialog}
      <Toast visible={toast !== null} message={toast ?? ''} tone="success" onHide={() => setToast(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: space[8],
  },
  thanksBox: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    padding: space[6],
    gap: space[5],
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.primary }),
  },
  periodHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayRow: {
    flexDirection: 'row',
    gap: space[3],
  },
  dayCell: {
    flex: 1,
  },
  period: {
    backgroundColor: color.bg.canvas,
    borderRadius: radius.input,
    padding: space[5],
  },
  periodText: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.primary }),
  },
  delete: {
    backgroundColor: color.status.error,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: '#ffffff' }),
  },
  venueSheet: {
    paddingHorizontal: space.screenX,
    paddingBottom: space[6],
    gap: space[6],
  },
});
