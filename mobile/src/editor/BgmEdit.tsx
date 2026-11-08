/* eslint-disable react-hooks/refs -- PanResponder callbacks only read refs inside gesture events, never during render; the rule can't tell them apart from render code. */
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, TextInput, View, type GestureResponderEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { AudioSource } from 'expo-audio';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { BGM_AUDIO_READY, MIN_CLIP, SPEEDS, bgmTrackById, bgmTrackSource, formatClock } from './bgm';
import { BGM, EndIcon, PauseIcon, PlayIcon, StartIcon, WaveGlyph } from './bgmUi';
import { useClipPlayer } from './useClipPlayer';
import { Help } from './ui';
import type { Bgm } from './types';

const PAD = 14; // 손잡이 두께 — 손잡이 안쪽이 쓸 구간이에요.
const STRIP = 36;
const FLAT = Array.from({ length: 72 }, () => 45);

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));
const round1 = (v: number) => Math.round(v * 10) / 10;

function metaOf(bgm: Bgm): {
  source: AudioSource | null;
  name: string;
  sub: string;
  peaks: number[];
  dur0: number;
} | null {
  if (bgm.mode === 'file' && bgm.file) {
    return {
      source: { uri: bgm.file.uri },
      name: bgm.file.name,
      sub: '내 음악',
      peaks: FLAT,
      dur0: bgm.file.duration ?? 0,
    };
  }
  const track = bgmTrackById(bgm.trackId);
  if (!track) return null;
  return {
    source: bgmTrackSource(track),
    name: track.name,
    sub: `${track.composer} · 원곡 ${formatClock(track.durationSec)}`,
    peaks: track.peaks,
    dur0: track.durationSec,
  };
}

/**
 * 노래 편집 — 쓸 구간(손잡이 안쪽)과 재생 속도를 정해요. [적용하기]를 눌러야 저장되고,
 * 뒤로 가면 바꾼 내용은 취소돼요(바꾼 게 있으면 SettingsSheet가 물어봐요: dirtyRef).
 */
export function BgmEdit({ bgm, onApply, dirtyRef }: { bgm: Bgm; onApply: (next: Bgm) => void; dirtyRef: MutableRefObject<boolean> }) {
  const meta = metaOf(bgm);
  const [start, setStart] = useState(bgm.start ?? 0);
  const [endRaw, setEndRaw] = useState<number | null>(bgm.end ?? null);
  const [speed, setSpeed] = useState(bgm.speed ?? 1);
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState<{ kind: 's' | 'e'; f: number } | null>(null);
  const [timeEdit, setTimeEdit] = useState<{
    kind: 's' | 'e';
    m: string;
    s: string;
    error: string;
  } | null>(null);

  const clip = useMemo(() => ({ start, end: endRaw, speed }), [start, endRaw, speed]);
  const player = useClipPlayer(meta?.source ?? null, clip);
  const dur = player.duration || meta?.dur0 || 0;
  const end = endRaw != null ? Math.min(endRaw, dur || endRaw) : dur;
  const iw = Math.max(0, width - PAD * 2);
  const px = (t: number) => (dur ? (t / dur) * iw : 0);
  const sx = px(start);
  const ex = px(end);
  const pos = clamp(player.position, start, end);
  const trimmed = start > 0 || (dur > 0 && end < dur - 0.05);

  useEffect(() => {
    dirtyRef.current = start !== (bgm.start ?? 0) || (endRaw ?? null) !== (bgm.end ?? null) || speed !== (bgm.speed ?? 1);
  });

  // 재생 위치가 바뀐 구간 밖으로 나가면 시작으로.
  useEffect(() => {
    if (player.playing && dur > 0 && (player.position < start - 0.05 || player.position >= end)) player.seek(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end]);

  const live = useRef({ start, end, dur, iw, pos, playing: false });
  const api = useRef({ play: player.play, seek: player.seek });
  useEffect(() => {
    live.current = { start, end, dur, iw, pos, playing: player.playing };
    api.current = { play: player.play, seek: player.seek };
  });

  const setPoint = useCallback((kind: 's' | 'e', v: number) => {
    const L = live.current;
    if (!L.dur) return;
    if (kind === 's') setStart(clamp(round1(v), 0, L.end - MIN_CLIP));
    else setEndRaw(clamp(round1(v), L.start + MIN_CLIP, L.dur));
  }, []);

  const dragRef = useRef({ base: 0, dx0: 0, f: 1 });
  const grips = useMemo(() => {
    const make = (kind: 's' | 'e') =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          const L = live.current;
          dragRef.current = {
            base: kind === 's' ? L.start : L.end,
            dx0: 0,
            f: 1,
          };
          setDrag({ kind, f: 1 });
        },
        onPanResponderMove: (_e, g) => {
          const L = live.current;
          if (!L.iw || !L.dur) return;
          // 손가락을 아래로 내릴수록 느리게(세밀하게) 움직여요.
          const dy = Math.abs(g.dy);
          const f = dy < 40 ? 1 : dy < 90 ? 0.5 : dy < 150 ? 0.25 : 0.1;
          if (f !== dragRef.current.f) {
            dragRef.current = {
              base: kind === 's' ? L.start : L.end,
              dx0: g.dx,
              f,
            };
            setDrag({ kind, f });
          }
          const d = dragRef.current;
          setPoint(kind, d.base + ((g.dx - d.dx0) / L.iw) * L.dur * d.f);
        },
        onPanResponderRelease: () => setDrag(null),
        onPanResponderTerminate: () => setDrag(null),
      });
    return { s: make('s'), e: make('e') };
  }, [setPoint]);

  const seekTo = useCallback((e: GestureResponderEvent) => {
    const L = live.current;
    if (!L.iw || !L.dur) return;
    const t = clamp(((e.nativeEvent.locationX - PAD) / L.iw) * L.dur, L.start, L.end - 0.3);
    if (L.playing) api.current.seek(t);
    else api.current.play(t);
  }, []);
  const seeker = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: seekTo,
        onPanResponderMove: seekTo,
      }),
    [seekTo],
  );


  const mark = (kind: 's' | 'e') => setPoint(kind, round1(player.position));
  const openTime = (kind: 's' | 'e') => {
    const v = kind === 's' ? start : end;
    const m = Math.floor(v / 60);
    const sec = round1(v - m * 60);
    setTimeEdit({
      kind,
      m: String(m),
      s: sec % 1 ? sec.toFixed(1) : String(Math.floor(sec)).padStart(2, '0'),
      error: '',
    });
  };
  const confirmTime = () => {
    if (!timeEdit) return;
    const m = parseInt(timeEdit.m || '0', 10);
    const sec = parseFloat((timeEdit.s || '0').replace(',', '.'));
    const fail = (error: string) => setTimeEdit({ ...timeEdit, error });
    if (Number.isNaN(m) || Number.isNaN(sec) || m < 0 || sec < 0 || sec >= 60) return fail('초는 0~59로 입력해 주세요');
    const v = round1(m * 60 + sec);
    if (timeEdit.kind === 's' && v > end - MIN_CLIP) return fail(`시작은 ${formatClock(end - MIN_CLIP, true)} 이전이어야 해요`);
    if (timeEdit.kind === 'e' && v < start + MIN_CLIP) return fail(`끝은 ${formatClock(start + MIN_CLIP, true)} 이후여야 해요`);
    if (timeEdit.kind === 'e' && v > dur) return fail(`곡 길이(${formatClock(dur)}) 안에서 입력해 주세요`);
    setPoint(timeEdit.kind, v);
    setTimeEdit(null);
  };

  const apply = () => {
    onApply({
      ...bgm,
      start: start > 0 ? start : undefined,
      end: dur > 0 && end < dur - 0.05 ? end : undefined,
      speed: speed !== 1 ? speed : undefined,
      ...(bgm.mode === 'file' && bgm.file ? { file: { ...bgm.file, duration: dur || bgm.file.duration } } : {}),
    });
  };

  if (!meta) return <Help>곡을 먼저 골라 주세요.</Help>;

  const bars = (c: string) =>
    meta.peaks.map((p, i) => (
      <View
        key={i}
        style={{
          flex: 1,
          height: `${p}%`,
          minHeight: 3,
          marginHorizontal: 0.5,
          borderRadius: 1,
          backgroundColor: c,
        }}
      />
    ));
  const dragValue = drag ? (drag.kind === 's' ? start : end) : 0;

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#a28bff', BGM.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.art}>
        <WaveGlyph size={30} />
      </LinearGradient>
      <Text style={styles.name}>{meta.name}</Text>
      <Text style={styles.sub}>{meta.sub}</Text>
      <View style={styles.lenPill}>
        <Text style={styles.lenLabel}>재생 길이</Text>
        <Text style={styles.lenValue}>{formatClock(Math.round((end - start) / speed))}</Text>
      </View>
      {!meta.source && !BGM_AUDIO_READY ? (
        <Help>음원 파일이 아직 연결되지 않아 들어볼 수는 없어요. (개발 중에는 .env의 EXPO_PUBLIC_BGM_BASE_URL을 채워 주세요)</Help>
      ) : null}

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>구간</Text>
          {trimmed ? (
            <Pressable
              onPress={() => {
                setStart(0);
                setEndRaw(null);
              }}
              hitSlop={8}
            >
              <Text style={styles.reset}>전체 사용</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.tlw} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          <View style={styles.strip} {...seeker.panHandlers}>
            <View style={[styles.bars, { left: PAD, width: iw }]} pointerEvents="none">
              {bars(BGM.barOff)}
            </View>
            <View style={[styles.onClip, { left: PAD + sx, width: Math.max(0, ex - sx) }]} pointerEvents="none">
              <View style={[styles.bars, { left: -sx, width: iw }]}>{bars(BGM.accent)}</View>
            </View>
          </View>
          <View style={[styles.frame, { left: PAD + sx - PAD, width: Math.max(0, ex - sx) + PAD * 2 }]} pointerEvents="none" />
          <View style={[styles.notch, { left: PAD + sx - PAD + 5.5 }]} pointerEvents="none" />
          <View style={[styles.notch, { left: PAD + ex + 5.5 }]} pointerEvents="none" />
          <View style={[styles.playLine, { left: PAD + px(pos) - 1 }]} pointerEvents="none" />
          <View style={[styles.playDot, { left: PAD + px(pos) - 6 }]} pointerEvents="none" />
          <View style={[styles.grip, { left: PAD + sx - PAD - 10 }]} {...grips.s.panHandlers} accessibilityLabel="구간 시작 손잡이" />
          <View style={[styles.grip, { left: PAD + ex - 10 }]} {...grips.e.panHandlers} accessibilityLabel="구간 끝 손잡이" />
          {drag ? (
            <View style={[styles.bubble, { left: Math.max(0, PAD + px(dragValue) - 40) }]} pointerEvents="none">
              <Text style={styles.bubbleText}>{`${formatClock(dragValue, true)}${drag.f < 1 ? ` · ×${drag.f}` : ''}`}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.times}>
          <Text style={styles.timeNow}>{formatClock(pos)}</Text>
          <Text style={styles.timeTotal}>{formatClock(dur)}</Text>
        </View>

        <View style={styles.controls}>
          <View style={styles.mkc}>
            <Pressable onPress={() => mark('s')} hitSlop={6} style={styles.mki} accessibilityLabel="현재 위치를 시작으로">
              <StartIcon />
            </Pressable>
            <Pressable onPress={() => openTime('s')} hitSlop={6} accessibilityLabel="시작 시간 입력">
              <Text style={styles.mkt}>{formatClock(start, true)}</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => (player.playing ? player.pause() : player.play())}
            style={styles.playBtn}
            accessibilityLabel={player.playing ? '일시정지' : '재생'}
          >
            {player.playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </Pressable>
          <View style={styles.mkc}>
            <Pressable onPress={() => openTime('e')} hitSlop={6} accessibilityLabel="끝 시간 입력">
              <Text style={styles.mkt}>{formatClock(end, true)}</Text>
            </Pressable>
            <Pressable onPress={() => mark('e')} hitSlop={6} style={styles.mki} accessibilityLabel="현재 위치를 끝으로">
              <EndIcon />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>속도</Text>
          <Text style={styles.speedValue}>{`${speed}×`}</Text>
        </View>
        <View style={styles.seg}>
          {SPEEDS.map((v) => (
            <Pressable key={v} onPress={() => setSpeed(v)} style={[styles.segItem, speed === v && styles.segOn]}>
              <Text style={[styles.segLabel, speed === v && styles.segLabelOn]}>{`${v}×`}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable onPress={apply} style={styles.cta} accessibilityRole="button">
        <Text style={styles.ctaLabel}>적용하기</Text>
      </Pressable>

      <ConfirmDialog
        visible={timeEdit !== null}
        title={`${timeEdit?.kind === 's' ? '시작' : '끝'} 시간 입력`}
        confirmLabel="확인"
        tone="primary"
        onCancel={() => setTimeEdit(null)}
        onConfirm={confirmTime}
      >
        <Text style={styles.dialogHint}>{`곡 길이 ${formatClock(dur)} · 구간은 최소 ${MIN_CLIP}초`}</Text>
        <View style={styles.timeInputs}>
          <TextInput
            value={timeEdit?.m ?? ''}
            onChangeText={(m) => timeEdit && setTimeEdit({ ...timeEdit, m, error: '' })}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
            style={styles.timeInput}
          />
          <Text style={styles.timeUnit}>분</Text>
          <TextInput
            value={timeEdit?.s ?? ''}
            onChangeText={(s) => timeEdit && setTimeEdit({ ...timeEdit, s, error: '' })}
            keyboardType="decimal-pad"
            maxLength={4}
            selectTextOnFocus
            style={styles.timeInput}
          />
          <Text style={styles.timeUnit}>초</Text>
        </View>
        <Text style={styles.dialogError}>{timeEdit?.error ?? ''}</Text>
      </ConfirmDialog>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  art: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...textStyle({
      size: 'title2',
      weight: 'semibold',
      color: color.ink.primary,
    }),
    marginTop: space[3],
    textAlign: 'center',
  },
  sub: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    marginTop: 2,
  },
  lenPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    backgroundColor: BGM.tint,
    borderRadius: radius.pill,
    paddingHorizontal: space[5],
    paddingVertical: 5,
    marginTop: space[3],
    marginBottom: space[3],
  },
  lenLabel: {
    ...textStyle({
      size: 'caption',
      weight: 'regular',
      color: color.ink.muted,
    }),
  },
  lenValue: {
    ...textStyle({ size: 'body', weight: 'semibold', color: BGM.accent }),
    fontVariant: ['tabular-nums'],
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: BGM.panel,
    borderRadius: 26,
    padding: space[6],
    marginTop: space[3],
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...textStyle({
      size: 'body',
      weight: 'semibold',
      color: color.ink.primary,
    }),
  },
  reset: {
    ...textStyle({ size: 'small', weight: 'semibold', color: BGM.accent }),
  },
  tlw: {
    height: STRIP,
    marginTop: space[7],
  },
  strip: {
    height: STRIP,
    backgroundColor: BGM.strip,
    borderRadius: 6,
  },
  bars: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  onClip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  frame: {
    position: 'absolute',
    top: -6,
    height: STRIP + 12,
    borderWidth: 3,
    borderLeftWidth: PAD,
    borderRightWidth: PAD,
    borderColor: BGM.accent,
    borderRadius: 6,
  },
  notch: {
    position: 'absolute',
    top: STRIP / 2 - 9,
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  playLine: {
    position: 'absolute',
    top: -10,
    width: 2,
    height: STRIP + 20,
    borderRadius: 1,
    backgroundColor: BGM.playhead,
  },
  playDot: {
    position: 'absolute',
    top: -16,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BGM.playhead,
    borderWidth: 2,
    borderColor: '#fff',
  },
  grip: {
    position: 'absolute',
    top: -6,
    width: 34,
    height: STRIP + 12,
  },
  bubble: {
    position: 'absolute',
    top: -44,
    backgroundColor: color.ink.primary,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  bubbleText: {
    ...textStyle({ size: 'caption', weight: 'semibold', color: '#fff' }),
    fontVariant: ['tabular-nums'],
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space[5],
  },
  timeNow: {
    ...textStyle({
      size: 'micro',
      weight: 'semibold',
      color: color.ink.primary,
    }),
    fontVariant: ['tabular-nums'],
  },
  timeTotal: {
    ...textStyle({ size: 'micro', weight: 'regular', color: color.ink.muted }),
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space[6],
  },
  mkc: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    shadowColor: '#3c288c',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  mki: {
    width: 38,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mkt: {
    ...textStyle({ size: 'label', weight: 'semibold', color: BGM.accent }),
    fontVariant: ['tabular-nums'],
    paddingHorizontal: 6,
    marginHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#b8aef0',
    borderStyle: 'dashed',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BGM.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BGM.accent,
    shadowOpacity: 0.38,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  speedValue: {
    ...textStyle({
      size: 'title3',
      weight: 'semibold',
      color: color.ink.primary,
    }),
    fontVariant: ['tabular-nums'],
  },
  seg: {
    flexDirection: 'row',
    gap: 4,
    marginTop: space[5],
    backgroundColor: BGM.segment,
    borderRadius: radius.pill,
    padding: 4,
  },
  segItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  segOn: {
    backgroundColor: BGM.accent,
  },
  segLabel: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.label }),
  },
  segLabelOn: {
    fontFamily: 'Pretendard-SemiBold',
    color: '#fff',
  },
  cta: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 18,
    backgroundColor: BGM.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space[6],
  },
  ctaLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: '#fff' }),
  },
  dialogHint: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    marginTop: space[3],
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[3],
    marginTop: space[6],
  },
  timeInput: {
    width: 58,
    height: 46,
    borderWidth: 1.5,
    borderColor: color.line.default,
    borderRadius: radius.button,
    textAlign: 'center',
    ...textStyle({
      size: 'title2',
      weight: 'semibold',
      color: color.ink.primary,
    }),
    backgroundColor: '#fff',
  },
  timeUnit: {
    ...textStyle({
      size: 'body',
      weight: 'regular',
      color: color.ink.secondary,
    }),
  },
  dialogError: {
    ...textStyle({
      size: 'micro',
      weight: 'regular',
      color: color.status.error,
    }),
    minHeight: 18,
    marginTop: space[3],
    textAlign: 'center',
  },
});
