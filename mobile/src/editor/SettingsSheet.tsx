import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import type { Project } from '../types/project';
import { FontList } from './sheets/common';
import { fontMeta } from './fonts';
import { Help, Section, SelectRow, ToggleList } from './ui';
import type { Bgm, FontId, Invitation } from './types';
import { CoverPicker } from './CoverPicker';
import { BgmSettings } from './BgmSettings';
import { bgmSummary } from './bgm';
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
  onProject: (patch: Partial<Pick<Project, 'colors' | 'eventAt' | 'venue'>>) => void;
  invitation: Invitation;
  onCover: (photoId: string) => void;
  onBgm: (bgm: Bgm) => void;
  onPopupEnabled: (enabled: boolean) => void;
  /** 안내 팝업 탭으로 이동 (설정 창은 닫혀요). */
  onEditPopup: () => void;
};

type Page = 'main' | 'font' | 'cover' | 'bgm' | 'venue';
const PAGE_TITLE: Record<Page, string> = { main: '전체 설정', font: '기본 글꼴', cover: '대표 사진', bgm: '배경음악', venue: '장소' };

/** ⚙ 전체 설정 — things that apply to the whole invitation rather than one block. */
export function SettingsSheet({ visible, onClose, project, font, onFont, onProject, invitation, onCover, onBgm, onPopupEnabled, onEditPopup }: Props) {
  const [page, setPage] = useState<Page>('main');
  const cover = coverPhoto(invitation);
  const [bgmLabel, bgmValue] = bgmSummary(invitation.bgm);
  const popupOn = invitation.popup?.enabled ?? false;

  const close = () => {
    setPage('main');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={close} title={PAGE_TITLE[page]} maxHeight="88%">
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {page !== 'main' ? (
          <Pressable onPress={() => setPage('main')} hitSlop={8}>
            <Text style={styles.back}>‹ 전체 설정으로</Text>
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
          <BgmSettings bgm={invitation.bgm} onChange={onBgm} />
        ) : page === 'venue' ? (
          <>
            <VenueFields project={project} onVenue={(venue) => onProject({ venue })} />
            <Help>초대장의 장소 칸과 관리 › 프로젝트 설정에 같이 반영돼요.</Help>
          </>
        ) : (
          <>
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
            <Section label="안내 팝업" sub="초대장을 열면 먼저 떠요">
              <ToggleList items={[{ key: 'popup', label: '안내 팝업 사용', value: popupOn, onChange: onPopupEnabled }]} />
              {popupOn ? (
                <SelectRow
                  label="내용 편집"
                  onPress={() => {
                    close();
                    onEditPopup();
                  }}
                />
              ) : null}
              <Help>주차 · 셔틀처럼 놓치기 쉬운 정보를 적어 두면 게스트가 먼저 봐요. 관리 › 프로젝트 설정과 같은 설정이에요.</Help>
            </Section>
          </>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
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
