import { useEffect, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { Help } from './ui';
import {
  BGM_AUDIO_READY,
  BGM_EXTENSIONS,
  BGM_MAX_BYTES,
  BGM_TRACKS,
  bgmClip,
  bgmSummary,
  bgmTrackById,
  bgmTrackSource,
  formatBytes,
  formatClock,
  type BgmTrack,
} from './bgm';
import { BGM, EditIcon, PauseIcon, PlayIcon } from './bgmUi';
import { useClipPlayer } from './useClipPlayer';
import type { Bgm } from './types';

const MODES: { value: Bgm['mode']; label: string }[] = [
  { value: 'off', label: '끄기' },
  { value: 'list', label: '곡 고르기' },
  { value: 'file', label: '내 음악' },
];

/** ⚙ 전체 설정 › 배경음악: 끄기 / 곡 고르기(목록) / 내 음악(파일 올리기). 초대장에 한 곡만 들어가요. */
export function BgmSettings({
  bgm,
  onChange,
  onEdit,
  onOpenSources,
}: {
  bgm: Bgm | undefined;
  onChange: (bgm: Bgm) => void;
  /** 노래 편집(구간 · 속도) 화면으로. */
  onEdit: () => void;
  /** 음원 출처 · 라이선스 화면으로. */
  onOpenSources: () => void;
}) {
  const value: Bgm = bgm ?? { mode: 'off' };
  const [label, extra] = bgmSummary(value);
  const has = value.mode === 'list' ? !!bgmTrackById(value.trackId) : value.mode === 'file' ? !!value.file : false;
  // 모드를 바꾸면 구간 · 속도는 곡마다 따로라서 초기화돼요.
  const setMode = (mode: Bgm['mode']) =>
    onChange({
      mode,
      trackId: mode === 'list' ? value.trackId : undefined,
      file: mode === 'file' ? value.file : undefined,
      uploadAgreed: value.uploadAgreed,
    });

  return (
    <View style={styles.wrap}>
      <View style={styles.seg}>
        {MODES.map((m) => {
          const on = value.mode === m.value;
          return (
            <Pressable key={m.value} onPress={() => setMode(m.value)} style={[styles.segItem, on && styles.segItemOn]}>
              <Text style={[styles.segLabel, on && styles.segLabelOn]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {value.mode === 'off' ? (
        <Help>초대장에 배경음악이 나오지 않아요.</Help>
      ) : (
        <Text style={[styles.status, has && styles.statusOn]}>
          {has ? <Text style={styles.statusStrong}>✓ 적용 중 </Text> : null}
          {has
            ? `${label}${extra ? ` · ${extra}` : ''}`
            : value.mode === 'list'
              ? '곡을 고르면 초대장에 적용돼요'
              : '음악 파일을 고르면 초대장에 적용돼요'}
        </Text>
      )}
      {value.mode === 'list' ? <TrackList bgm={value} onChange={onChange} onEdit={onEdit} /> : null}
      {value.mode === 'file' ? <MyMusic bgm={value} onChange={onChange} onEdit={onEdit} /> : null}
      {value.mode === 'list' ? (
        <Pressable onPress={onOpenSources} style={styles.srcLink}>
          <Text style={styles.srcLinkLabel}>음원 출처 · 라이선스</Text>
          <Text style={styles.srcChevron}>›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function EditChips({ bgm, trackDuration }: { bgm: Bgm; trackDuration: number }) {
  const chips: string[] = [];
  if (bgm.start != null || bgm.end != null) chips.push(`구간 ${formatClock(bgm.start ?? 0, true)}~${formatClock(bgm.end ?? trackDuration, true)}`);
  if (bgm.speed != null && bgm.speed !== 1) chips.push(`속도 ${bgm.speed}×`);
  return (
    <View style={styles.chips}>
      {chips.length ? (
        chips.map((c) => (
          <View key={c} style={styles.chip}>
            <Text style={styles.chipLabel}>{c}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.chipNone}>원곡 그대로</Text>
      )}
    </View>
  );
}

function EditButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.editBtn} accessibilityRole="button">
      <EditIcon />
      <Text style={styles.editBtnLabel}>편집하기</Text>
    </Pressable>
  );
}

function TrackList({ bgm, onChange, onEdit }: { bgm: Bgm; onChange: (bgm: Bgm) => void; onEdit: () => void }) {
  const [req, setReq] = useState<{ id: string; n: number } | null>(null);
  const reqTrack = bgmTrackById(req?.id);
  const reqSelected = bgm.mode === 'list' && bgm.trackId === req?.id;
  const clip = reqSelected ? bgmClip(bgm) : { start: 0, end: null, speed: 1 };
  const player = useClipPlayer(reqTrack ? bgmTrackSource(reqTrack) : null, clip);
  const { play } = player;

  useEffect(() => {
    // 곡을 고르거나 ▶를 누르면 (설정한 구간이 있으면 구간 시작부터) 처음부터 들려줘요.
    if (req) play(reqSelected ? (bgm.start ?? 0) : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req]);

  const select = (t: BgmTrack) => {
    if (!(bgm.mode === 'list' && bgm.trackId === t.id)) onChange({ mode: 'list', trackId: t.id, uploadAgreed: bgm.uploadAgreed });
    setReq({ id: t.id, n: (req?.n ?? 0) + 1 });
  };
  const preview = (t: BgmTrack) => {
    if (req?.id === t.id && player.playing) player.pause();
    else setReq({ id: t.id, n: (req?.n ?? 0) + 1 });
  };

  return (
    <>
      <View style={styles.card}>
        {BGM_TRACKS.map((t, i) => {
          const on = bgm.mode === 'list' && bgm.trackId === t.id;
          const isReq = req?.id === t.id;
          const isPlaying = isReq && player.playing;
          return (
            <View key={t.id} style={[i > 0 && styles.divider, on && styles.trackOn]}>
              <View style={styles.track}>
                <Pressable onPress={() => preview(t)} hitSlop={8} style={styles.play} accessibilityLabel={isPlaying ? '멈추기' : '미리 듣기'}>
                  {isPlaying ? <PauseIcon size={13} color={BGM.accent} /> : <PlayIcon size={13} color={BGM.accent} />}
                </Pressable>
                <Pressable onPress={() => select(t)} style={styles.trackText}>
                  <Text style={styles.trackName} numberOfLines={1}>
                    {t.name}
                  </Text>
                  <Text style={styles.trackSub} numberOfLines={1}>{`${t.composer} · ${t.orig}`}</Text>
                </Pressable>
                <Text style={styles.trackDur}>{formatClock(t.durationSec)}</Text>
                <Text style={styles.check}>{on ? '✓' : ''}</Text>
              </View>
              {isReq && (isPlaying || player.position > 0) ? (
                <View style={styles.progress}>
                  <View style={styles.bar}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.min(100, (player.position / t.durationSec) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.barTimes}>
                    <Text style={styles.barNow}>{formatClock(player.position)}</Text>
                    <Text style={styles.barTotal}>{formatClock(t.durationSec)}</Text>
                  </View>
                </View>
              ) : null}
              {on ? (
                <View style={styles.editRow}>
                  <EditChips bgm={bgm} trackDuration={t.durationSec} />
                  <EditButton onPress={onEdit} />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      <Help>{'▶로 미리 듣고, 곡 이름을 눌러 골라요.\n고른 곡은 [편집하기]에서 구간과 속도를 바꿀 수 있어요.'}</Help>
      {!BGM_AUDIO_READY ? <Help>음원 파일이 아직 연결되지 않아 미리 들을 수는 없어요. (EXPO_PUBLIC_BGM_BASE_URL)</Help> : null}
    </>
  );
}

function MyMusic({ bgm, onChange, onEdit }: { bgm: Bgm; onChange: (bgm: Bgm) => void; onEdit: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [agreeOpen, setAgreeOpen] = useState(false);
  const file = bgm.file;
  const player = useClipPlayer(file ? { uri: file.uri } : null, bgmClip(bgm));
  const { duration } = player;

  useEffect(() => {
    // 불러온 길이를 저장해 두면 노래 편집 · 요약에서 바로 쓸 수 있어요.
    if (file && duration > 0 && file.duration == null) onChange({ ...bgm, file: { ...file, duration } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, file?.uri]);

  const pick = async () => {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/mpeg', 'audio/mp4', 'audio/x-m4a'],
      copyToCacheDirectory: true,
    });
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
    player.pause();
    onChange({
      mode: 'file',
      file: { uri: asset.uri, name: asset.name, size: asset.size ?? 0 },
      uploadAgreed: bgm.uploadAgreed,
    });
  };
  const onPick = () => (bgm.uploadAgreed ? pick() : setAgreeOpen(true));

  const progress = duration > 0 ? Math.min(1, player.position / duration) : 0;

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
              <Text style={styles.fileMeta}>{[duration > 0 ? formatClock(duration) : null, formatBytes(file.size)].filter(Boolean).join(' · ')}</Text>
            </View>
            <Pressable
              onPress={() => {
                player.pause();
                onChange({ mode: 'file', uploadAgreed: bgm.uploadAgreed });
              }}
              hitSlop={10}
              accessibilityLabel="음악 지우기"
            >
              <Text style={styles.remove}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.playerRow}>
            <Pressable
              onPress={() => (player.playing ? player.pause() : player.play())}
              hitSlop={8}
              style={styles.play}
              accessibilityLabel={player.playing ? '멈추기' : '미리 듣기'}
            >
              {player.playing ? <PauseIcon size={13} color={BGM.accent} /> : <PlayIcon size={13} color={BGM.accent} />}
            </Pressable>
            <View style={styles.playerBar}>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
              </View>
              <View style={styles.barTimes}>
                <Text style={styles.barNow}>{formatClock(player.position)}</Text>
                <Text style={styles.barTotal}>{duration > 0 ? formatClock(duration) : ''}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.editRow, styles.editRowFile]}>
            <EditChips bgm={bgm} trackDuration={duration} />
            <EditButton onPress={onEdit} />
          </View>
        </View>
      ) : null}
      <Pressable onPress={onPick} style={styles.drop} accessibilityRole="button">
        <Text style={styles.dropTitle}>{file ? '다른 파일로 바꾸기' : '음악 파일 고르기'}</Text>
        <Text style={styles.dropSub}>mp3 · m4a · 15MB까지</Text>
      </Pressable>
      {error ? <Help error>{error}</Help> : null}
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>내 음악을 쓰기 전에 확인해 주세요</Text>
        <Text style={styles.noticeBody}>
          {'저작권이 있는 음악은 사용 권한이 있는지 직접 확인해 주세요.\n올린 음악으로 생기는 저작권 문제의 책임은 올린 분께 있어요.'}
        </Text>
      </View>
      <ConfirmDialog
        visible={agreeOpen}
        title="음악 파일을 올리기 전에 확인해 주세요"
        confirmLabel="확인했어요"
        tone="primary"
        onCancel={() => setAgreeOpen(false)}
        onConfirm={() => {
          setAgreeOpen(false);
          onChange({ ...bgm, uploadAgreed: true });
          pick();
        }}
      >
        <Text style={styles.agreeBody}>
          {'저작권이 있는 음악은 사용 권한이 있어야 해요.\n올린 음악으로 생기는 저작권 문제의 책임은 올리는 분께 있어요.'}
        </Text>
      </ConfirmDialog>
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
  status: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    marginHorizontal: 2,
  },
  statusOn: {
    color: color.ink.secondary,
  },
  statusStrong: {
    fontFamily: 'Pretendard-SemiBold',
    color: BGM.accent,
  },
  card: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.cardHome,
    overflow: 'hidden',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
  },
  trackOn: {
    backgroundColor: BGM.tint,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingHorizontal: space[6],
    paddingVertical: space[5],
  },
  trackText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  trackName: {
    ...textStyle({
      size: 'body',
      weight: 'semibold',
      color: color.ink.primary,
    }),
  },
  trackSub: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  trackDur: {
    width: 38,
    textAlign: 'right',
    ...textStyle({ size: 'micro', weight: 'regular', color: color.ink.muted }),
    fontVariant: ['tabular-nums'],
  },
  check: {
    width: 16,
    textAlign: 'center',
    ...textStyle({ size: 'control', weight: 'semibold', color: BGM.accent }),
  },
  play: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: color.line.strong,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    marginLeft: 46 + space[6],
    marginRight: space[6],
    marginBottom: space[3],
  },
  bar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: color.line.strong,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: BGM.accent,
  },
  barTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  barNow: {
    ...textStyle({
      size: 'caption',
      weight: 'regular',
      color: color.ink.muted,
    }),
    fontVariant: ['tabular-nums'],
  },
  barTotal: {
    ...textStyle({
      size: 'caption',
      weight: 'regular',
      color: color.ink.muted,
    }),
    fontVariant: ['tabular-nums'],
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    marginLeft: 46 + space[6],
    marginRight: space[6],
    marginBottom: space[5],
    marginTop: space[3],
  },
  editRowFile: {
    marginLeft: space[6],
  },
  chips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BGM.chipBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chipLabel: {
    ...textStyle({
      size: 'caption',
      weight: 'semibold',
      color: color.ink.label,
    }),
    fontVariant: ['tabular-nums'],
  },
  chipNone: {
    ...textStyle({
      size: 'caption',
      weight: 'regular',
      color: color.ink.muted,
    }),
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: space[6],
    borderRadius: radius.pill,
    backgroundColor: BGM.accent,
  },
  editBtnLabel: {
    ...textStyle({ size: 'label', weight: 'semibold', color: '#fff' }),
  },
  srcLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[5],
    paddingHorizontal: 2,
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
  },
  srcLinkLabel: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.label }),
  },
  srcChevron: {
    ...textStyle({
      size: 'title3',
      weight: 'regular',
      color: color.ink.placeholder,
    }),
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
    ...textStyle({
      size: 'label',
      weight: 'semibold',
      color: color.ink.primary,
    }),
  },
  fileMeta: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    marginTop: 2,
  },
  remove: {
    ...textStyle({
      size: 'control',
      weight: 'regular',
      color: color.ink.muted,
    }),
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingHorizontal: space[6],
    paddingVertical: space[5],
  },
  playerBar: {
    flex: 1,
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
    ...textStyle({
      size: 'label',
      weight: 'semibold',
      color: color.accent.base,
    }),
  },
  dropSub: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  notice: {
    backgroundColor: '#fff6e8',
    borderWidth: 1,
    borderColor: '#f0dcb8',
    borderRadius: radius.button,
    padding: space[5],
    gap: 2,
  },
  noticeTitle: {
    ...textStyle({ size: 'label', weight: 'semibold', color: '#7a5a1c' }),
  },
  noticeBody: {
    ...textStyle({
      size: 'small',
      weight: 'regular',
      lineHeight: 'body',
      color: '#7a5a1c',
    }),
  },
  agreeBody: {
    ...textStyle({
      size: 'label',
      weight: 'regular',
      lineHeight: 'body',
      color: color.ink.secondary,
    }),
    marginTop: space[3],
  },
});
