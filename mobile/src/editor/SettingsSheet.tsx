import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { TextField } from '../components/TextField';
import { BottomSheet } from '../components/BottomSheet';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import type { Project } from '../types/project';
import { FontList } from './sheets/common';
import { fontMeta } from './fonts';
import { Help, Section, SelectRow } from './ui';
import type { Bgm, FontId, Invitation } from './types';
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

type Props = {
  visible: boolean;
  onClose: () => void;
  project: Project;
  font: FontId;
  onFont: (f: FontId) => void;
  onProject: (patch: Partial<Pick<Project, 'colors' | 'eventAt' | 'venue' | 'title'>>) => void;
  invitation: Invitation;
  onCover: (photoId: string) => void;
  onBgm: (bgm: Bgm) => void;
  /** 설정 창을 닫으면서 알려줄 말 (예: 배경음악을 저장했어요). */
  onNotify?: (message: string) => void;
  /** 열 때 바로 보여줄 하위 화면 (예: 에디터의 배경음악 버튼 → 'bgm'). */
  initialPage?: Page;
};

export type Page = 'main' | 'font' | 'cover' | 'bgm' | 'bgedit' | 'bgmsrc' | 'bgmsrc1' | 'venue';
const PAGE_TITLE: Record<Page, string> = {
  main: '초대장 설정',
  font: '기본 글꼴',
  cover: '대표 사진',
  bgm: '배경음악',
  bgedit: '노래 편집',
  bgmsrc: '음원 출처 · 라이선스',
  bgmsrc1: '음원 정보',
  venue: '장소',
};
const BACK_LABEL: Partial<Record<Page, string>> = { bgedit: '배경음악으로', bgmsrc: '배경음악으로', bgmsrc1: '음원 목록으로' };

/**
 * ⚙ 초대장 설정 — 초대장 전체에 걸린 것(이름 · 일시 · 장소 · 글꼴 · 색 · 대표 사진 · 배경음악).
 * 공유는 위쪽 [공유] 버튼, 안내 팝업 · 감사페이지는 탭에서 바꿔요(여기에는 없어요).
 */
export function SettingsSheet({ visible, onClose, project, font, onFont, onProject, invitation, onCover, onBgm, onNotify, initialPage }: Props) {
  const [page, setPage] = useState<Page>(initialPage ?? 'main');
  const [title, setTitle] = useState(project.title);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setPage(initialPage ?? 'main');
      setTitle(project.title);
    }
  }
  const cover = coverPhoto(invitation);
  const [bgmLabel, bgmValue] = bgmSummary(invitation.bgm);
  const [srcId, setSrcId] = useState<string | undefined>(undefined);
  const editDirty = useRef(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  /** 초대장 이름 — 비우면 원래대로 되돌려요. */
  const commitTitle = () => {
    const next = title.trim();
    if (next && next !== project.title) onProject({ title: next });
    else setTitle(project.title);
  };
  const close = () => {
    commitTitle();
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
            <Text style={styles.back}>{`‹ ${BACK_LABEL[page] ?? '초대장 설정으로'}`}</Text>
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
            <Help>초대장의 장소 칸에도 같이 반영돼요.</Help>
          </>
        ) : (
          <>
            <Section label="초대장 이름" sub="내 목록 · 공유 미리보기 · 홍보물 제목에 쓰여요">
              <TextField value={title} onChangeText={setTitle} onBlur={commitTitle} onSubmitEditing={commitTitle} maxLength={30} returnKeyType="done" />
            </Section>
            <Section label="행사 정보" sub="일시 등 초대장 전체에 같이 반영돼요">
              <EventInfoRows project={project} onEventAt={(eventAt) => onProject({ eventAt })} onOpenVenue={() => setPage('venue')} />
            </Section>
            <Section label="기본 글꼴">
              <SelectRow label={fontMeta(font).label} onPress={() => setPage('font')} />
            </Section>
            <ThemeColorPicker colors={projectColors(project)} onChange={(colors) => onProject({ colors })} />
            <Section label="대표 사진">
              <Pressable onPress={() => setPage('cover')} style={styles.coverRow}>
                {cover ? <Image source={{ uri: cover.uri }} style={styles.coverThumb} /> : <View style={[styles.coverThumb, styles.coverEmpty]} />}
                <Text style={styles.coverLabel} numberOfLines={1}>
                  {cover ? '공유 미리보기 · 감사페이지 · 홍보물에 쓰여요' : '초대장에 사진을 넣으면 고를 수 있어요'}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </Section>
            <Section label="배경음악">
              <SelectRow label={bgmLabel} value={bgmValue || undefined} muted={!bgmValue} onPress={() => setPage('bgm')} />
            </Section>
            <Help>공유 · 안내 팝업 · 감사페이지 설정은 여기에 없어요. 공유는 위쪽 [공유] 버튼, 안내 팝업 · 감사페이지는 위쪽 탭에서 바꿔요.</Help>
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
