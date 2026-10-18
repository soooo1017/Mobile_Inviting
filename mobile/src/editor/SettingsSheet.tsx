import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BottomSheet } from '../components/BottomSheet';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { THEMES, type Project } from '../types/project';
import { FontList } from './sheets/common';
import { fontMeta } from './fonts';
import { formatWhenShort } from './format';
import { Help, Section, SelectRow } from './ui';
import type { FontId } from './types';

type Props = {
  visible: boolean;
  onClose: () => void;
  project: Project;
  font: FontId;
  onFont: (f: FontId) => void;
  onProject: (patch: Partial<Pick<Project, 'themeId' | 'eventAt'>>) => void;
};

/** ⚙ 전체 설정 — things that apply to the whole invitation rather than one block. */
export function SettingsSheet({ visible, onClose, project, font, onFont, onProject }: Props) {
  const [page, setPage] = useState<'main' | 'font'>('main');
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const eventDate = new Date(project.eventAt);
  const whenShort = formatWhenShort(project.eventAt); // "2027. 5. 22. (토) 오후 1:00"

  const close = () => {
    setPage('main');
    setPicker(null);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={close} title={page === 'font' ? '기본 글꼴' : '전체 설정'} maxHeight="88%">
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {page === 'font' ? (
          <>
            <Pressable onPress={() => setPage('main')} hitSlop={8}>
              <Text style={styles.back}>‹ 전체 설정으로</Text>
            </Pressable>
            <FontList mode="default" value={font} defaultFont={font} onChange={(f) => f && onFont(f)} />
            <Help>모든 서식에 이 글꼴이 들어가요. 블록마다 따로 바꾼 글꼴은 그대로예요.</Help>
          </>
        ) : (
          <>
            <Section label="기본 글꼴">
              <SelectRow label={fontMeta(font).label} onPress={() => setPage('font')} />
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
            <Section label="행사 정보" sub="일시 블록 등에 같이 반영돼요">
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
            <Section label="배경음악 (BGM)">
              <View style={styles.soon}>
                <Text style={styles.soonText}>초대장에 하나만 들어가요 · 준비 중이에요</Text>
              </View>
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
  soon: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.line.dashed,
    borderRadius: radius.input,
    padding: 13,
  },
  soonText: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
  },
});
