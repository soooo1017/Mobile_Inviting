import { useEffect, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { SelectChip } from '../components/SelectChip';
import { Help } from './ui';
import { BGM_CATEGORIES, BGM_EXTENSIONS, BGM_MAX_BYTES, BGM_TRACKS, formatBytes, formatDuration, type BgmTrack } from './bgm';
import type { Bgm } from './types';

const MODES: { value: Bgm['mode']; label: string }[] = [
  { value: 'off', label: '끄기' },
  { value: 'list', label: '곡 고르기' },
  { value: 'file', label: '내 음악' },
];

/** ⚙ 전체 설정 › 배경음악: 끄기 / 곡 고르기(목록) / 내 음악(파일 올리기). One song per invitation. */
export function BgmSettings({ bgm, onChange }: { bgm: Bgm | undefined; onChange: (bgm: Bgm) => void }) {
  const value: Bgm = bgm ?? { mode: 'off' };
  useEffect(() => {
    // 미리 듣기 should be audible even with the iPhone's silent switch on.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  return (
    <View style={styles.wrap}>
      <View style={styles.seg}>
        {MODES.map((m) => {
          const on = value.mode === m.value;
          return (
            <Pressable key={m.value} onPress={() => onChange({ ...value, mode: m.value })} style={[styles.segItem, on && styles.segItemOn]}>
              <Text style={[styles.segLabel, on && styles.segLabelOn]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {value.mode === 'off' ? <Help>초대장에 배경음악이 나오지 않아요.</Help> : null}
      {value.mode === 'list' ? <TrackList selectedId={value.trackId} onSelect={(trackId) => onChange({ ...value, trackId })} /> : null}
      {value.mode === 'file' ? <MyMusic bgm={value} onChange={onChange} /> : null}
    </View>
  );
}

function TrackList({ selectedId, onSelect }: { selectedId?: string; onSelect: (id: string) => void }) {
  const [category, setCategory] = useState<(typeof BGM_CATEGORIES)[number]['value']>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const tracks = BGM_TRACKS.filter((t) => category === 'all' || t.category === category);
  const playing = BGM_TRACKS.find((t) => t.id === playingId);
  const player = useAudioPlayer(playing?.source ?? null);
  useEffect(() => {
    if (playing) player.play();
  }, [playing, player]);

  return (
    <>
      <View style={styles.chips}>
        {BGM_CATEGORIES.map((c) => (
          <SelectChip key={c.value} label={c.label} selected={category === c.value} onPress={() => setCategory(c.value)} />
        ))}
      </View>
      {tracks.length ? (
        <View style={styles.card}>
          {tracks.map((t: BgmTrack, i) => {
            const on = t.id === selectedId;
            const isPlaying = t.id === playingId;
            return (
              <Pressable key={t.id} onPress={() => onSelect(t.id)} style={[styles.track, i > 0 && styles.divider, on && styles.trackOn]}>
                <Pressable
                  onPress={() => {
                    if (isPlaying) player.pause();
                    setPlayingId(isPlaying ? null : t.id);
                  }}
                  hitSlop={8}
                  style={styles.play}
                  accessibilityLabel={isPlaying ? '멈추기' : '미리 듣기'}
                >
                  <Text style={styles.playGlyph}>{isPlaying ? '❚❚' : '▶'}</Text>
                </Pressable>
                <Text style={styles.trackName} numberOfLines={1}>
                  {t.name}
                </Text>
                {on ? <Text style={styles.check}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>곡 목록을 준비하고 있어요</Text>
          <Text style={styles.emptyDesc}>지금은 ‘내 음악’에서 음악 파일을 올려서 쓸 수 있어요.</Text>
        </View>
      )}
      <Help>처음부터 반복 재생돼요.</Help>
    </>
  );
}

function MyMusic({ bgm, onChange }: { bgm: Bgm; onChange: (bgm: Bgm) => void }) {
  const [error, setError] = useState<string | null>(null);
  const file = bgm.file;
  const player = useAudioPlayer(file ? { uri: file.uri } : null);
  const status = useAudioPlayerStatus(player);

  const pick = async () => {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({ type: ['audio/mpeg', 'audio/mp4', 'audio/x-m4a'], copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const ext = asset.name.split('.').pop()?.toLowerCase() ?? '';
    if (!BGM_EXTENSIONS.includes(ext)) {
      setError('mp3 · m4a 파일만 올릴 수 있어요.');
      return;
    }
    if ((asset.size ?? 0) > BGM_MAX_BYTES) {
      setError('15MB까지 올릴 수 있어요. 더 작은 파일로 골라주세요.');
      return;
    }
    onChange({ ...bgm, mode: 'file', file: { uri: asset.uri, name: asset.name, size: asset.size ?? 0 } });
  };

  const progress = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;

  return (
    <>
      {file ? (
        <View style={styles.card}>
          <View style={styles.file}>
            <View style={styles.fileIcon}>
              <Text style={styles.fileIconGlyph}>♪</Text>
            </View>
            <View style={styles.fileText}>
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={styles.fileMeta}>
                {[status.duration > 0 ? formatDuration(status.duration) : null, formatBytes(file.size)].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                player.pause();
                onChange({ ...bgm, file: undefined });
              }}
              hitSlop={10}
              accessibilityLabel="음악 지우기"
            >
              <Text style={styles.remove}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.playerRow}>
            <Pressable
              onPress={() => (status.playing ? player.pause() : player.play())}
              hitSlop={8}
              style={styles.play}
              accessibilityLabel={status.playing ? '멈추기' : '미리 듣기'}
            >
              <Text style={styles.playGlyph}>{status.playing ? '❚❚' : '▶'}</Text>
            </Pressable>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.time}>{formatDuration(status.currentTime)}</Text>
          </View>
        </View>
      ) : null}
      <Pressable onPress={pick} style={styles.drop} accessibilityRole="button">
        <Text style={styles.dropTitle}>{file ? '다른 파일로 바꾸기' : '음악 파일 고르기'}</Text>
        <Text style={styles.dropSub}>mp3 · m4a · 15MB까지</Text>
      </Pressable>
      {error ? <Help error>{error}</Help> : null}
      <Help>저작권이 있는 음악은 사용 권한이 있는지 꼭 확인해 주세요.</Help>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space[6],
  },
  seg: {
    flexDirection: 'row',
    gap: 2,
    backgroundColor: color.line.soft,
    borderRadius: radius.card,
    padding: 3,
  },
  segItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space[4],
    borderRadius: radius.card - 2,
  },
  segItemOn: {
    backgroundColor: color.bg.surface,
  },
  segLabel: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
  },
  segLabelOn: {
    color: color.ink.primary,
    fontFamily: 'Pretendard-SemiBold',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
  },
  card: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingHorizontal: space[6],
    paddingVertical: space[5],
  },
  trackOn: {
    backgroundColor: color.accent.tint,
  },
  trackName: {
    flex: 1,
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.primary }),
  },
  check: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.accent.base }),
  },
  play: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: color.line.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: {
    fontSize: 10,
    color: color.ink.secondary,
  },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.line.dashed,
    borderRadius: radius.card,
    paddingVertical: space[10],
    paddingHorizontal: space[6],
    alignItems: 'center',
    gap: space[3],
  },
  emptyTitle: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }),
  },
  emptyDesc: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    textAlign: 'center',
  },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingHorizontal: space[6],
    paddingTop: space[5],
  },
  fileIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.input,
    backgroundColor: color.accent.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconGlyph: {
    fontSize: 17,
    color: color.accent.base,
  },
  fileText: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }),
  },
  fileMeta: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    marginTop: 2,
  },
  remove: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.muted }),
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingHorizontal: space[6],
    paddingVertical: space[5],
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.line.strong,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: color.accent.base,
  },
  time: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    fontVariant: ['tabular-nums'],
  },
  drop: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: color.accent.tintBorder,
    borderRadius: radius.card,
    backgroundColor: color.bg.surface,
    paddingVertical: space[7],
    alignItems: 'center',
    gap: space[2],
  },
  dropTitle: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.accent.base }),
  },
  dropSub: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
});
