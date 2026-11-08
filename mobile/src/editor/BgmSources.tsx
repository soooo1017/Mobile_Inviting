import { Pressable, Text, View, StyleSheet } from 'react-native';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { BGM_TRACKS, bgmEditNotes, type BgmTrack } from './bgm';
import { LicenseIcons } from './bgmUi';
import type { Bgm } from './types';

/** 초대장 맨 아래에 들어가는 음원 표기 — CC BY는 저작자 표시가 필요해서 꼭 넣고, 퍼블릭 도메인도 같은 모양으로 보여줘요. */
export function BgmCredit({ track, bgm, onDark, ink }: { track: BgmTrack; bgm?: Bgm; onDark?: boolean; ink?: string }) {
  const notes = track.license === 'CC BY' ? bgmEditNotes(bgm) : [];
  const text = ink ?? (onDark ? '#fff' : color.ink.secondary);
  const label = { ...styles.creditLabel, color: text };
  const value = { ...styles.creditValue, color: text };
  return (
    <View style={styles.credit}>
      <Text style={[styles.creditRow, value]}>
        <Text style={label}>제목 </Text>
        {track.credit}
        {notes.length ? ` · ${notes.join(' · ')}` : ''}
      </Text>
      <Text style={[styles.creditRow, value]}>
        <Text style={label}>연주 </Text>
        {track.performer}
      </Text>
      <Text style={[styles.creditRow, value]}>
        <Text style={label}>출처 </Text>
        {'Musopen        '}
        <Text style={label}>라이선스 </Text>
        {track.license === 'CC BY' ? 'CC BY' : '퍼블릭 도메인'}
      </Text>
    </View>
  );
}

/** 음원 출처 · 라이선스 › 곡 목록 — 곡 이름 · 작곡가 · 원제만 보이고, 누르면 곡 상세가 열려요. */
export function BgmSourceList({ onOpen }: { onOpen: (trackId: string) => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.intro}>앱에서 제공하는 배경음악의 출처예요. 곡을 누르면 자세한 정보를 볼 수 있어요.</Text>
      <View style={styles.card}>
        {BGM_TRACKS.map((t, i) => (
          <Pressable key={t.id} onPress={() => onOpen(t.id)} style={[styles.row, i > 0 && styles.divider]}>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>{t.name}</Text>
              <Text style={styles.rowSub}>{`${t.composer} · ${t.orig}`}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.intro}>‘내 음악’으로 직접 올린 음악은 여기에 포함되지 않아요. 저작권은 올린 분께 있어요.</Text>
    </View>
  );
}

/** 곡 상세 — 라이선스 아이콘 · 작곡 · 연주 · 출처 · 초대장에 표시되는 문구. */
export function BgmSourceDetail({ track }: { track: BgmTrack }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailName}>{track.name}</Text>
      <Text style={styles.detailOrig}>{track.orig}</Text>
      <View style={styles.icons}>
        <LicenseIcons license={track.license} />
      </View>
      <View style={styles.dl}>
        <Text style={styles.dt}>작곡</Text>
        <Text style={styles.dd}>{track.composer}</Text>
        <Text style={styles.dt}>연주</Text>
        <Text style={styles.dd}>{track.performer}</Text>
        <Text style={styles.dt}>출처</Text>
        <Text style={styles.dd}>{`Musopen\n${track.sourceUrl.replace('https://', '')}`}</Text>
      </View>
      <View style={styles.quote}>
        <Text style={styles.quoteTitle}>초대장 맨 아래에 이렇게 표시돼요</Text>
        <BgmCredit track={track} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space[5],
  },
  intro: {
    ...textStyle({
      size: 'small',
      weight: 'regular',
      lineHeight: 'body',
      color: color.ink.muted,
    }),
  },
  card: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[6],
    paddingVertical: space[5],
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    ...textStyle({
      size: 'body',
      weight: 'semibold',
      color: color.ink.primary,
    }),
  },
  rowSub: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  chevron: {
    ...textStyle({
      size: 'title3',
      weight: 'regular',
      color: color.ink.placeholder,
    }),
  },
  detail: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.cardHome,
    padding: space[6],
  },
  detailName: {
    ...textStyle({
      size: 'title3',
      weight: 'semibold',
      color: color.ink.primary,
    }),
  },
  detailOrig: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    marginTop: 2,
  },
  icons: {
    marginTop: space[5],
    marginBottom: space[5],
  },
  dl: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: space[3],
  },
  dt: {
    width: 44,
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  dd: {
    width: '85%',
    ...textStyle({
      size: 'small',
      weight: 'regular',
      lineHeight: 'body',
      color: color.ink.secondary,
    }),
  },
  quote: {
    marginTop: space[6],
    backgroundColor: color.bg.segment,
    borderRadius: radius.input,
    padding: space[5],
    gap: space[3],
  },
  quoteTitle: {
    ...textStyle({
      size: 'caption',
      weight: 'regular',
      color: color.ink.muted,
    }),
  },
  credit: {
    gap: 4,
  },
  creditRow: {
    lineHeight: 20,
  },
  creditLabel: {
    ...textStyle({ size: 'caption', weight: 'semibold' }),
  },
  creditValue: {
    ...textStyle({ size: 'caption', weight: 'regular' }),
  },
});
