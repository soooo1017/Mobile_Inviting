import { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BottomSheet } from '../components/BottomSheet';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { THEMES, type Project } from '../types/project';
import { FontList } from './sheets/common';
import { fontMeta } from './fonts';
import { formatWhenShort } from './format';
import { Help, Section, SelectRow } from './ui';
import type { Bgm, FontId, Invitation } from './types';
import { CoverPicker } from './CoverPicker';
import { BgmSettings } from './BgmSettings';
import { bgmSummary } from './bgm';
import { coverPhoto } from './photos';

type Props = {
  visible: boolean;
  onClose: () => void;
  project: Project;
  font: FontId;
  onFont: (f: FontId) => void;
  onProject: (patch: Partial<Pick<Project, 'themeId' | 'eventAt'>>) => void;
  invitation: Invitation;
  onCover: (photoId: string) => void;
  onBgm: (bgm: Bgm) => void;
};

type Page = 'main' | 'font' | 'cover' | 'bgm';
const PAGE_TITLE: Record<Page, string> = { main: '전체 설정', font: '기본 글꼴', cover: '대표 사진', bgm: '배경음악' };

/** ⚙ 전체 설정 — things that apply to the whole invitation rather than one block. */
export function SettingsSheet({ visible, onClose, project, font, onFont, onProject, invitation, onCover, onBgm }: Props) {
  const [page, setPage] = useState<Page>('main');
  const cover = coverPhoto(invitation);
  const [bgmLabel, bgmValue] = bgmSummary(invitation.bgm);
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const eventDate = new Date(project.eventAt);
  const whenShort = formatWhenShort(project.eventAt); // "2027. 5. 22. (토) 오후 1:00"

  const close = () => {
    setPage('main');
    setPicker(null);
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
            <Section label="배경 테마">
              <View style={styles.themes}>
                {THEMES.map((t) => {
                  const on = t.id === project.themeId;
                  return (
                    <Pressable key={t.id} onPress={() => onProject({ themeId: t.id })} style={styles.themeCell}>
                      <View style={[styles.swatch, { backgroundColor: t.colors[0] }, on && styles.swatchOn]}>
                        <View style={[styles.swatchDot, { backgroundColor: t.colors[1] }]} />
                      </View>
                      <Text style={[styles.themeName, on && styles.themeNameOn]}>{t.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Help>글씨 색은 배경에 맞춰 자동으로 정해져요.</Help>
            </Section>
            <Section label="행사 정보" sub="일시 등 초대장 전체에 같이 반영돼요">
              <SelectRow label={whenShort.slice(0, whenShort.indexOf(')') + 1)} value="날짜" onPress={() => setPicker(picker === 'date' ? null : 'date')} />
              <SelectRow label={whenShort.slice(whenShort.indexOf(')') + 2)} value="시간" onPress={() => setPicker(picker === 'time' ? null : 'time')} />
              {picker ? (
                <View style={styles.pickerWrap}>
                  <DateTimePicker
                    locale="ko-KR"
                    value={eventDate}
                    mode={picker}
                    display={Platform.OS === 'ios' ? (picker === 'date' ? 'inline' : 'spinner') : 'default'}
                    accentColor={color.select.fill}
                    onChange={(e, d) => {
                      if (Platform.OS !== 'ios') setPicker(null);
                      if (e.type !== 'set' || !d) return;
                      const next = new Date(eventDate);
                      if (picker === 'date') next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                      else next.setHours(d.getHours(), d.getMinutes(), 0, 0);
                      onProject({ eventAt: next.toISOString() });
                    }}
                  />
                </View>
              ) : null}
            </Section>
            <Section label="배경음악">
              <SelectRow label={bgmLabel} value={bgmValue || undefined} muted={!bgmValue} onPress={() => setPage('bgm')} />
            </Section>
          </>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  // iOS draws the inline calendar at its own width, flush left — center it in the sheet.
  pickerWrap: {
    alignItems: 'center',
  },
  body: {
    paddingHorizontal: space.screenX,
    paddingBottom: space[6],
    gap: space[8],
  },
  back: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.accent.base }),
  },
  themes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[4],
  },
  themeCell: {
    width: '30.5%',
    alignItems: 'center',
    gap: space[2],
  },
  swatch: {
    width: '100%',
    height: 54,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.line.default,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 6,
  },
  swatchOn: {
    borderWidth: 2,
    borderColor: color.select.fill,
  },
  swatchDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  themeName: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.secondary }),
  },
  themeNameOn: {
    color: color.select.fill,
    fontFamily: 'Pretendard-SemiBold',
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
