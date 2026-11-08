import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import type { Project, ProjectLink } from '../types/project';
import { FontList } from './sheets/common';
import { fontMeta } from './fonts';
import { Help, Section, SelectRow, ToggleList } from './ui';
import { popupStartDays, type Bgm, type FontId, type Invitation } from './types';
import { CoverPicker } from './CoverPicker';
import { BgmSettings } from './BgmSettings';
import { BgmEdit } from './BgmEdit';
import { BgmSourceDetail, BgmSourceList } from './BgmSources';
import { bgmSummary, bgmTrackById } from './bgm';
import { coverPhoto } from './photos';
import { VenueFields } from './VenueFields';
import { EventInfoRows } from './EventInfoRows';
import { ThemeColorPicker } from './ThemeColorPicker';
import { projectColors } from './invitationTheme';
import { PopupStartPicker } from './PopupStartPicker';
import { ShareControl } from '../screens/share/ShareControl';

type Props = {
  visible: boolean;
  onClose: () => void;
  project: Project;
  font: FontId;
  onFont: (f: FontId) => void;
  onProject: (patch: Partial<Pick<Project, 'colors' | 'eventAt' | 'venue'>>) => void;
  invitation: Invitation;
  onCover: (photoId: string) => void;
  onBgm: (bgm: Bgm) => void;
  onPopupEnabled: (enabled: boolean) => void;
  /** 안내 팝업이 행사 며칠 전부터 뜰지 (null = 공유하면 바로). */
  onPopupStart: (startDays: number | null) => void;
  /** 안내 팝업 탭으로 이동 (설정 창은 닫혀요). */
  onEditPopup: () => void;
  /** 감사페이지 사용 여부 — 프로젝트 설정과 같은 설정이에요. */
  onThanksEnabled: (enabled: boolean) => void;
  /** 감사페이지 탭으로 이동 (설정 창은 닫혀요). */
  onEditThanks: () => void;
  /** 공유 시작 · 중지. */
  onShared: (shared: boolean) => void;
  onLinkChange: (link: ProjectLink) => void;
  /** 설정 창을 닫으면서 알려줄 말 (예: 배경음악을 저장했어요). */
  onNotify?: (message: string) => void;
  /** 열 때 바로 보여줄 하위 화면 (예: 에디터의 배경음악 버튼 → 'bgm'). */
  initialPage?: Page;
};

export type Page = 'main' | 'font' | 'cover' | 'bgm' | 'bgedit' | 'bgmsrc' | 'bgmsrc1' | 'venue';
const PAGE_TITLE: Record<Page, string> = {
  main: '전체 설정',
  font: '기본 글꼴',
  cover: '대표 사진',
  bgm: '배경음악',
  bgedit: '노래 편집',
  bgmsrc: '음원 출처 · 라이선스',
  bgmsrc1: '음원 정보',
  venue: '장소',
};
const BACK_LABEL: Partial<Record<Page, string>> = { bgedit: '배경음악으로', bgmsrc: '배경음악으로', bgmsrc1: '음원 목록으로' };

/** ⚙ 전체 설정 — things that apply to the whole invitation rather than one block. */
export function SettingsSheet({ visible, onClose, project, font, onFont, onProject, invitation, onCover, onBgm, onPopupEnabled, onPopupStart, onEditPopup, onThanksEnabled, onEditThanks, onShared, onLinkChange, onNotify, initialPage }: Props) {
  const [page, setPage] = useState<Page>(initialPage ?? 'main');
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setPage(initialPage ?? 'main');
  }
  const cover = coverPhoto(invitation);
  const [bgmLabel, bgmValue] = bgmSummary(invitation.bgm);
  const popupOn = invitation.popup?.enabled ?? false;
  const [srcId, setSrcId] = useState<string | undefined>(undefined);
  const editDirty = useRef(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const close = () => {
    setPage('main');
    onClose();
  };
  const back = () => {
    if (page === 'bgedit') {
      if (editDirty.current) setDiscardOpen(true);
      else setPage('bgm');
    } else if (page === 'bgmsrc1') setPage('bgmsrc');
    else if (page === 'bgmsrc') setPage('bgm');
    else setPage('main');
  };
  /** 배경음악 › 완료 — 창을 닫고 어떻게 저장됐는지 알려줘요. */
  const finishBgm = () => {
    const [name, extra] = bgmSummary(invitation.bgm);
    const off = !invitation.bgm || invitation.bgm.mode === 'off';
    const none = !off && name === '곡을 골라주세요';
    close();
    onNotify?.(
      off ? '배경음악 없이 저장했어요' : none ? '곡을 고르지 않아서 배경음악 없이 저장했어요' : `배경음악을 저장했어요 · ${name}${extra && /^(구간|\d)/.test(extra) ? ` (${extra})` : ''}`,
    );
  };

  return (
    <>
    <BottomSheet
      visible={visible}
      onClose={close}
      title={PAGE_TITLE[page]}
      maxHeight={page === 'bgedit' ? '95%' : '88%'}
      action={page === 'bgm' ? { label: '완료', onPress: finishBgm } : undefined}
    >
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {page !== 'main' ? (
          <Pressable onPress={back} hitSlop={8}>
            <Text style={styles.back}>{`‹ ${BACK_LABEL[page] ?? '전체 설정으로'}`}</Text>
          </Pressable>
        ) : null}
        {page === 'font' ? (
          <>
            <FontList mode="default" value={font} defaultFont={font} onChange={(f) => f && onFont(f)} />
            <Help>초대장 전체 글에 이 글꼴이 들어가요. 따로 글꼴을 바꾼 곳은 그대로예요.</Help>
          </>
        ) : page === 'cover' ? (
          <CoverPicker invitation={invitation} onSelect={onCover} />
        ) : page === 'bgm' ? (
          <BgmSettings bgm={invitation.bgm} onChange={onBgm} onEdit={() => setPage('bgedit')} onOpenSources={() => setPage('bgmsrc')} />
        ) : page === 'bgedit' ? (
          <BgmEdit
            bgm={invitation.bgm ?? { mode: 'off' }}
            dirtyRef={editDirty}
            onApply={(next) => {
              onBgm(next);
              editDirty.current = false;
              setPage('bgm');
            }}
          />
        ) : page === 'bgmsrc' ? (
          <BgmSourceList
            onOpen={(id) => {
              setSrcId(id);
              setPage('bgmsrc1');
            }}
          />
        ) : page === 'bgmsrc1' ? (
          (() => {
            const track = bgmTrackById(srcId);
            return track ? <BgmSourceDetail track={track} /> : null;
          })()
        ) : page === 'venue' ? (
          <>
            <VenueFields project={project} onVenue={(venue) => onProject({ venue })} />
            <Help>초대장의 장소 칸과 관리 › 프로젝트 설정에 같이 반영돼요.</Help>
          </>
        ) : (
          <>
            <Section label="공유" sub="시작해야 링크로 볼 수 있어요">
              <ShareControl project={project} onChange={onShared} onLinkChange={onLinkChange} />
            </Section>
            <Section label="기본 글꼴">
              <SelectRow label={fontMeta(font).label} onPress={() => setPage('font')} />
            </Section>
            <Section label="대표 사진">
              <Pressable onPress={() => setPage('cover')} style={styles.coverRow}>
                {cover ? <Image source={{ uri: cover.uri }} style={styles.coverThumb} /> : <View style={[styles.coverThumb, styles.coverEmpty]} />}
                <Text style={styles.coverLabel} numberOfLines={1}>
                  {cover ? '감사페이지 · 공유할 때 쓰여요' : '초대장에 사진을 넣으면 고를 수 있어요'}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </Section>
            <ThemeColorPicker colors={projectColors(project)} onChange={(colors) => onProject({ colors })} />
            <Section label="행사 정보" sub="일시 등 초대장 전체에 같이 반영돼요">
              <EventInfoRows project={project} onEventAt={(eventAt) => onProject({ eventAt })} onOpenVenue={() => setPage('venue')} />
            </Section>
            <Section label="배경음악">
              <SelectRow label={bgmLabel} value={bgmValue || undefined} muted={!bgmValue} onPress={() => setPage('bgm')} />
            </Section>
            <Section label="안내 팝업">
              <ToggleList items={[{ key: 'popup', label: '안내 팝업 사용', value: popupOn, onChange: onPopupEnabled }]} />
              {popupOn ? (
                <>
                  <PopupStartPicker eventAt={project.eventAt} value={popupStartDays(invitation.popup)} onChange={onPopupStart} />
                  <SelectRow
                    label="내용 편집"
                    onPress={() => {
                      close();
                      onEditPopup();
                    }}
                  />
                </>
              ) : null}
              <Help>{popupOn ? '관리 › 프로젝트 설정과 같은 설정이에요.' : '사용하지 않더라도 만들어 둔 내용은 보관돼요.'}</Help>
            </Section>
            <Section label="감사페이지">
              <ToggleList items={[{ key: 'thanks', label: '감사페이지 사용', value: project.thanks.enabled, onChange: onThanksEnabled }]} />
              {project.thanks.enabled ? (
                <SelectRow
                  label="내용 편집"
                  onPress={() => {
                    close();
                    onEditThanks();
                  }}
                />
              ) : null}
              <Help>
                {project.thanks.enabled
                  ? '행사 다음 날 자정부터 링크가 감사페이지로 바뀌어요. 관리 › 프로젝트 설정과 같은 설정이에요.'
                  : '사용하지 않으면 행사가 끝나도 초대장이 계속 보여요. 만들어 둔 감사페이지는 보관돼요.'}
              </Help>
            </Section>
          </>
        )}
      </ScrollView>
    </BottomSheet>
    <ConfirmDialog
      visible={discardOpen}
      title="변경한 내용을 버릴까요?"
      cancelLabel="계속 편집"
      confirmLabel="버리기"
      onCancel={() => setDiscardOpen(false)}
      onConfirm={() => {
        setDiscardOpen(false);
        editDirty.current = false;
        setPage('bgm');
      }}
    >
      <Text style={styles.discardBody}>적용하기를 누르지 않으면 바꾼 구간과 속도가 원래대로 돌아가요.</Text>
    </ConfirmDialog>
    </>
  );
}

const styles = StyleSheet.create({
  discardBody: {
    ...textStyle({ size: 'label', weight: 'regular', lineHeight: 'body', color: color.ink.secondary }),
    marginTop: space[3],
  },
  body: {
    paddingHorizontal: space.screenX,
    paddingBottom: space[6],
    gap: space[8],
  },
  back: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.accent.base }),
  },
  coverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.input,
    paddingHorizontal: space[5],
    paddingVertical: space[4],
  },
  coverThumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  coverEmpty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.line.dashed,
  },
  coverLabel: {
    flex: 1,
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.primary }),
  },
  chevron: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.placeholder }),
  },
});
