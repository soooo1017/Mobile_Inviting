/* eslint-disable react-hooks/refs -- PanResponder callbacks only read refs inside gesture events, never during render; the rule can't tell them apart from render code. */
import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, Text, View, StyleSheet, type GestureResponderEvent, type GestureResponderHandlers, type LayoutRectangle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ColorSheet } from '../editor/ThemeColorPicker';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { PosterArt, ScaledBox, type EditProps, type PosterData } from './PosterArt';
import {
  allRects,
  clamp,
  freezeTexts,
  overlapping,
  photoFrame,
  PHOTO_MIN,
  qrRect,
  qrSize,
  QR_MAX,
  QR_MIN,
  TEMPLATES,
  TEXT_SCALE_MAX,
  TEXT_SCALE_MIN,
  TEXT_STEPS,
  textRect,
  type ElKey,
  type Frame,
  type Measured,
  type PosterDesign,
  type Rect,
  type TextKey,
} from './model';

const HINT = '글 · 사진 · QR을 눌러 내 마음대로 꾸며 보세요';
const REVERT_MS = 3000;
const SNAP = 5;
const TEXT_LABEL: Record<TextKey, string> = { ment: '초대 멘트', name: '이름', date: '일시', place: '장소' };
const GRAD = ['#ff3b30', '#ffcc00', '#34c759', '#00c7be', '#0a84ff', '#bf5af2'];

type Warn = { kind: 'min' | 'bad'; text: string; id: number } | null;

function touchDistance(e: GestureResponderEvent) {
  const [a, b] = e.nativeEvent.touches;
  if (!a || !b) return 0;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

type Gesture = {
  key: ElKey;
  start: Rect;
  design: PosterDesign;
  /** 손가락 두 개일 때 처음 거리, 크기 배율의 시작값. */
  dist: number;
  base: number;
  latest: PosterDesign;
  minShown: boolean;
};

type Props = {
  design: PosterDesign;
  setDesign: (u: PosterDesign | ((d: PosterDesign) => PosterDesign)) => void;
  data: PosterData;
  onChangePhoto: () => void;
  onSave: () => void;
  onShare: () => void;
  busy: boolean;
};

/** 마무리 (3/3) — 홍보물을 크게 보여주고, 글 · QR · 사진을 끌어서 옮기고 크기 · 색을 고쳐요. */
export function PosterEditor({ design, setDesign, data, onChangePhoto, onSave, onShare, busy }: Props) {
  const spec = TEMPLATES[design.template];
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<ElKey | null>(null);
  const [measured, setMeasured] = useState<Measured>({ sizes: {}, flow: {} });
  const [bad, setBad] = useState<ElKey[]>([]);
  const [guides, setGuides] = useState({ x: false, y: false });
  const [warn, setWarn] = useState<Warn>(null);
  const [colorTarget, setColorTarget] = useState<'text' | 'bg' | null>(null);
  const [countdown] = useState(() => new Animated.Value(1));

  const scale = area.w > 0 && area.h > 0 ? Math.min(area.w / spec.w, area.h / spec.h) : 0;

  const live = useRef({ design, measured, scale, selected });
  useEffect(() => {
    live.current = { design, measured, scale, selected };
  });
  const valid = useRef(design); // 겹치지 않았던 마지막 모습 — 겹치면 여기로 되돌아가요
  const gesture = useRef<Gesture | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const evalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnId = useRef(0);

  // 템플릿이 바뀌면 처음 모습이 새 기준이에요.
  const lastTemplate = useRef(design.template);
  useEffect(() => {
    if (lastTemplate.current !== design.template) {
      lastTemplate.current = design.template;
      valid.current = design;
    }
  }, [design]);
  useEffect(
    () => () => {
      if (warnTimer.current) clearTimeout(warnTimer.current);
      if (evalTimer.current) clearTimeout(evalTimer.current);
    },
    [],
  );

  const showMin = () => {
    if (warnTimer.current) clearTimeout(warnTimer.current);
    setWarn({ kind: 'min', text: 'QR 인식을 위한 최소 크기예요', id: ++warnId.current });
    warnTimer.current = setTimeout(() => setWarn(null), REVERT_MS);
  };

  /** 겹쳤는지 보고, 겹쳤으면 3초 안내 뒤 직전 상태로 되돌려요 (그 사이 다시 옮기면 취소). */
  const evaluate = () => {
    const L = live.current;
    const keys = overlapping(allRects(L.design, L.measured));
    if (keys.length === 0) {
      valid.current = L.design;
      setBad([]);
      return;
    }
    if (warnTimer.current) clearTimeout(warnTimer.current);
    setBad(keys);
    setWarn({ kind: 'bad', text: '다른 요소와 겹칠 수 없어요', id: ++warnId.current });
    countdown.setValue(1);
    Animated.timing(countdown, { toValue: 0, duration: REVERT_MS, useNativeDriver: false }).start();
    warnTimer.current = setTimeout(() => {
      setDesign(valid.current);
      setBad([]);
      setWarn(null);
      warnTimer.current = null;
    }, REVERT_MS);
  };
  const scheduleEvaluate = () => {
    if (evalTimer.current) clearTimeout(evalTimer.current);
    evalTimer.current = setTimeout(evaluate, 140);
  };

  // ───────── 글 · QR · 사진 끌기 / 두 손가락 ─────────
  const rectFor = (key: ElKey, d: PosterDesign, m: Measured): Rect | null => {
    if (key === 'qr') return qrRect(d);
    if (key === 'photo') return photoFrame(d);
    return textRect(key, d, m);
  };

  const begin = (key: ElKey, e: GestureResponderEvent) => {
    if (evalTimer.current) clearTimeout(evalTimer.current);
    if (warnTimer.current) {
      clearTimeout(warnTimer.current);
      warnTimer.current = null;
      setWarn(null);
    }
    const L = live.current;
    setSelected(key);
    let d = L.design;
    if (key !== 'photo') {
      d = freezeTexts(d, L.measured);
      if (d !== L.design) setDesign(d);
    }
    const start = rectFor(key, d, L.measured);
    if (!start) return;
    const base = key === 'qr' ? qrSize(d) : key === 'photo' ? start.w : d.text[key].scale;
    gesture.current = { key, start, design: d, dist: touchDistance(e), base, latest: d, minShown: false };
  };

  const applyRect = (g: Gesture, r: Rect, extra?: Partial<{ scale: number; size: number }>): PosterDesign => {
    const d = g.design;
    const W = spec.w;
    const H = spec.h;
    const x = clamp(r.x, 0, W - r.w);
    const y = clamp(r.y, 0, H - r.h);
    if (g.key === 'qr') return { ...d, qr: { x, y, size: extra?.size ?? qrSize(d) } };
    if (g.key === 'photo') return { ...d, frame: { x, y, w: r.w, h: r.h } };
    const st = d.text[g.key];
    return { ...d, text: { ...d.text, [g.key]: { ...st, x, y, scale: extra?.scale ?? st.scale } } };
  };

  const move = (e: GestureResponderEvent, gs: { dx: number; dy: number }) => {
    const g = gesture.current;
    const L = live.current;
    if (!g || L.scale <= 0) return;
    const dist = touchDistance(e);
    if (dist > 0) {
      // 두 손가락: 크기 (가운데는 그대로)
      if (!g.dist) g.dist = dist;
      const ratio = dist / g.dist;
      const cx = g.start.x + g.start.w / 2;
      const cy = g.start.y + g.start.h / 2;
      if (g.key === 'qr') {
        const want = g.base * ratio;
        const size = clamp(want, QR_MIN, QR_MAX);
        if (want < QR_MIN && !g.minShown) {
          g.minShown = true;
          showMin();
        }
        const k = (size + 12) / g.start.w;
        const w = g.start.w * k;
        const h = g.start.h * k;
        g.latest = applyRect(g, { x: cx - w / 2, y: cy - h / 2, w, h }, { size });
      } else if (g.key === 'photo') {
        if (spec.photo.fixed) return;
        const w = clamp(g.base * ratio, PHOTO_MIN, spec.w);
        const k = w / g.start.w;
        const h = clamp(g.start.h * k, PHOTO_MIN, spec.h);
        g.latest = applyRect(g, { x: cx - w / 2, y: cy - h / 2, w, h });
      } else {
        const next = clamp(g.base * ratio, TEXT_SCALE_MIN, TEXT_SCALE_MAX);
        const k = next / g.base;
        const w = g.start.w * k;
        const h = g.start.h * k;
        g.latest = applyRect(g, { x: cx - w / 2, y: cy - h / 2, w, h }, { scale: next });
      }
      setDesign(g.latest);
      return;
    }
    if (g.key === 'photo' && spec.photo.fixed) return;
    let x = g.start.x + gs.dx / L.scale;
    let y = g.start.y + gs.dy / L.scale;
    const gx = Math.abs(x + g.start.w / 2 - spec.w / 2) < SNAP;
    const gy = Math.abs(y + g.start.h / 2 - spec.h / 2) < SNAP;
    if (gx) x = spec.w / 2 - g.start.w / 2;
    if (gy) y = spec.h / 2 - g.start.h / 2;
    setGuides((prev) => (prev.x === gx && prev.y === gy ? prev : { x: gx, y: gy }));
    const size = g.key === 'qr' ? qrSize(g.design) : undefined;
    g.latest = applyRect(g, { x, y, w: g.start.w, h: g.start.h }, size !== undefined ? { size } : undefined);
    setDesign(g.latest);
  };

  const end = () => {
    const g = gesture.current;
    gesture.current = null;
    setGuides({ x: false, y: false });
    if (!g) return;
    if (g.key === 'photo') {
      valid.current = g.latest;
      return;
    }
    scheduleEvaluate();
  };

  const makeResponder = (key: ElKey): GestureResponderHandlers =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => begin(key, e),
      onPanResponderMove: (e, gs) => move(e, gs),
      onPanResponderRelease: () => end(),
      onPanResponderTerminate: () => end(),
    }).panHandlers;

  // 사진 모서리 점: 크기 조절
  const makeCorner = (corner: 'tl' | 'tr' | 'bl' | 'br'): GestureResponderHandlers => {
    let start: Frame | null = null;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        start = photoFrame(live.current.design);
        if (warnTimer.current) clearTimeout(warnTimer.current);
      },
      onPanResponderMove: (_e, gs) => {
        const L = live.current;
        if (!start || L.scale <= 0) return;
        const dx = gs.dx / L.scale;
        const dy = gs.dy / L.scale;
        const left = corner === 'tl' || corner === 'bl';
        const top = corner === 'tl' || corner === 'tr';
        const right = start.x + start.w;
        const bottom = start.y + start.h;
        const nx = left ? clamp(start.x + dx, 0, right - PHOTO_MIN) : start.x;
        const nr = left ? right : clamp(right + dx, start.x + PHOTO_MIN, spec.w);
        const ny = top ? clamp(start.y + dy, 0, bottom - PHOTO_MIN) : start.y;
        const nb = top ? bottom : clamp(bottom + dy, start.y + PHOTO_MIN, spec.h);
        const frame = { x: nx, y: ny, w: nr - nx, h: nb - ny };
        setDesign({ ...L.design, frame });
      },
      onPanResponderRelease: () => {
        valid.current = live.current.design;
        start = null;
      },
      onPanResponderTerminate: () => {
        start = null;
      },
    }).panHandlers;
  };

  const [responders] = useState<Record<ElKey, GestureResponderHandlers>>(() => ({
    ment: makeResponder('ment'),
    name: makeResponder('name'),
    date: makeResponder('date'),
    place: makeResponder('place'),
    qr: makeResponder('qr'),
    photo: makeResponder('photo'),
  }));
  const [corners] = useState(() => ({ tl: makeCorner('tl'), tr: makeCorner('tr'), bl: makeCorner('bl'), br: makeCorner('br') }));

  // ───────── 옵션 칸 버튼 ─────────
  const commit = (next: PosterDesign) => {
    if (warnTimer.current) {
      clearTimeout(warnTimer.current);
      warnTimer.current = null;
      setWarn(null);
    }
    setDesign(next);
    scheduleEvaluate();
  };

  const stepText = (key: TextKey, dir: 1 | -1) => {
    const d = freezeTexts(design, measured);
    const st = d.text[key];
    const idx = TEXT_STEPS.reduce((best, s, i) => (Math.abs(s - st.scale) < Math.abs(TEXT_STEPS[best] - st.scale) ? i : best), 0);
    const to = TEXT_STEPS[clamp(idx + dir, 0, TEXT_STEPS.length - 1)];
    if (to === st.scale) return;
    const r = textRect(key, d, measured);
    const k = to / st.scale;
    const next = r
      ? { ...d, text: { ...d.text, [key]: { ...st, scale: to, x: clamp(r.x + r.w / 2 - (r.w * k) / 2, 0, spec.w - r.w * k), y: clamp(r.y + r.h / 2 - (r.h * k) / 2, 0, spec.h - r.h * k) } } }
      : { ...d, text: { ...d.text, [key]: { ...st, scale: to } } };
    commit(next);
  };

  const resetText = (key: TextKey) => {
    commit({ ...design, text: { ...design.text, [key]: { scale: 1 } } });
  };

  const setTextColor = (key: TextKey, c: string | undefined) => {
    setDesign({ ...design, text: { ...design.text, [key]: { ...design.text[key], color: c } } });
  };

  const qrSteps = [QR_MIN, Math.max(spec.qr.size, QR_MIN + 12), 96];
  const stepQr = (dir: 1 | -1) => {
    const d = freezeTexts(design, measured);
    const cur = qrSize(d);
    const idx = qrSteps.reduce((best, s, i) => (Math.abs(s - cur) < Math.abs(qrSteps[best] - cur) ? i : best), 0);
    if (dir === -1 && cur <= QR_MIN + 0.5) {
      showMin();
      return;
    }
    const to = qrSteps[clamp(idx + dir, 0, qrSteps.length - 1)];
    if (to === cur) return;
    const r = qrRect(d);
    const nb = { w: to + 12, h: to + 26 };
    commit({ ...d, qr: { size: to, x: clamp(r.x + r.w / 2 - nb.w / 2, 0, spec.w - nb.w), y: clamp(r.y + r.h / 2 - nb.h / 2, 0, spec.h - nb.h) } });
  };
  const resetQr = () => commit({ ...design, qr: {} });

  const stepPhoto = (dir: 1 | -1) => {
    const f = photoFrame(design);
    const k = dir === 1 ? 1.1 : 1 / 1.1;
    const w = clamp(f.w * k, PHOTO_MIN, spec.w);
    const h = clamp(f.h * k, PHOTO_MIN, spec.h);
    const x = clamp(f.x + f.w / 2 - w / 2, 0, spec.w - w);
    const y = clamp(f.y + f.h / 2 - h / 2, 0, spec.h - h);
    const next = { ...design, frame: { x, y, w, h } };
    setDesign(next);
    valid.current = next;
  };
  const resetPhoto = () => {
    const next = { ...design, frame: undefined };
    setDesign(next);
    valid.current = next;
  };

  const edit: EditProps = {
    selected,
    bad,
    responders,
    corners,
    guides,
    onBackground: () => setSelected(null),
    onTextLayout: (key: TextKey, r: LayoutRectangle, inFlow: boolean) =>
      setMeasured((m) => {
        const prev = m.sizes[key];
        const prevFlow = m.flow[key];
        const sameSize = prev && Math.abs(prev.w - r.width) < 0.5 && Math.abs(prev.h - r.height) < 0.5;
        const sameFlow = !inFlow || (prevFlow && Math.abs(prevFlow.x - r.x) < 0.5 && Math.abs(prevFlow.y - r.y) < 0.5);
        if (sameSize && sameFlow) return m;
        return {
          ...m,
          sizes: sameSize ? m.sizes : { ...m.sizes, [key]: { w: r.width, h: r.height } },
          flow: inFlow && !sameFlow ? { ...m.flow, [key]: { x: r.x, y: r.y } } : m.flow,
        };
      }),
    onGroupLayout: (r: LayoutRectangle) =>
      setMeasured((m) => (m.group && Math.abs(m.group.x - r.x) < 0.5 && Math.abs(m.group.y - r.y) < 0.5 ? m : { ...m, group: { x: r.x, y: r.y } })),
  };

  // ───────── 옵션 칸 ─────────
  const sel = selected;
  const textColors: { key: string; value: string | undefined; dot: string }[] = [
    { key: 'default', value: undefined, dot: sel && sel !== 'qr' && sel !== 'photo' ? defaultTextDot(sel, design, data) : data.ink },
    { key: 'accent', value: data.accent, dot: data.accent },
    { key: 'white', value: '#ffffff', dot: '#ffffff' },
    { key: 'black', value: '#111111', dot: '#111111' },
  ];

  let panel: React.ReactNode;
  if (sel === null) {
    panel = (
      <>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>배경 색</Text>
          <Dot dot={data.themeBg} on={design.bg === undefined} onPress={() => setDesign({ ...design, bg: undefined })} />
          <Dot dot="#ffffff" on={design.bg?.toLowerCase() === '#ffffff'} onPress={() => setDesign({ ...design, bg: '#ffffff' })} />
          <Dot multi on={design.bg !== undefined && design.bg.toLowerCase() !== '#ffffff'} onPress={() => setColorTarget('bg')} />
          <View style={styles.spacer} />
          <Text style={styles.muted}>초대장 색(기본)</Text>
        </View>
      </>
    );
  } else if (sel === 'qr') {
    panel = (
      <>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>QR 코드</Text>
          <View style={styles.spacer} />
          <Text style={styles.muted}>크기</Text>
          <Sq label="−" onPress={() => stepQr(-1)} />
          <Sq label="＋" onPress={() => stepQr(1)} />
          <Text style={styles.link} onPress={resetQr}>
            기본으로
          </Text>
        </View>
        <MessageRow warn={warn} countdown={countdown} />
      </>
    );
  } else if (sel === 'photo') {
    panel = (
      <>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>사진</Text>
          <View style={styles.spacer} />
          {spec.photo.fixed ? (
            <Text style={styles.muted}>사진 가득 · 위치만 조정해요</Text>
          ) : (
            <>
              <Text style={styles.muted}>크기</Text>
              <Sq label="−" onPress={() => stepPhoto(-1)} />
              <Sq label="＋" onPress={() => stepPhoto(1)} />
              <Text style={styles.link} onPress={resetPhoto}>
                기본으로
              </Text>
            </>
          )}
        </View>
        <View style={styles.row}>
          <Pressable onPress={onChangePhoto} style={styles.pbtn}>
            <Text style={styles.pbtnLabel}>사진 변경</Text>
          </Pressable>
        </View>
      </>
    );
  } else {
    const st = design.text[sel];
    panel = (
      <>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>{TEXT_LABEL[sel]}</Text>
          <View style={styles.spacer} />
          <Text style={styles.muted}>크기</Text>
          <Sq label="A−" onPress={() => stepText(sel, -1)} />
          <Sq label="A+" onPress={() => stepText(sel, 1)} />
          <Text style={styles.link} onPress={() => resetText(sel)}>
            기본으로
          </Text>
        </View>
        {warn ? (
          <MessageRow warn={warn} countdown={countdown} />
        ) : (
          <View style={styles.row}>
            <Text style={styles.rowTitle}>글 색</Text>
            {textColors.map((c) => (
              <Dot key={c.key} dot={c.dot} on={st.color === c.value} onPress={() => setTextColor(sel, c.value)} />
            ))}
            <Dot multi on={st.color !== undefined && !textColors.some((c) => c.value === st.color)} onPress={() => setColorTarget('text')} />
          </View>
        )}
      </>
    );
  }

  const colorValue = colorTarget === 'bg' ? design.bg ?? data.bg : sel && sel !== 'qr' && sel !== 'photo' ? design.text[sel].color ?? defaultTextDot(sel, design, data) : data.ink;

  return (
    <View style={styles.root}>
      <View style={styles.hint}>
        <Text style={styles.hintText}>{sel === null ? HINT : ' '}</Text>
      </View>
      <View style={styles.canvas} onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {scale > 0 ? (
          <ScaledBox w={spec.w} h={spec.h} scale={scale}>
            <PosterArt design={design} data={data} edit={edit} />
          </ScaledBox>
        ) : null}
      </View>
      <View style={styles.panel}>{panel}</View>
      <View style={styles.saveBar}>
        <Pressable onPress={onSave} disabled={busy} style={[styles.saveBtn, busy && styles.off]}>
          <Text style={styles.saveLabel}>사진첩에 저장</Text>
        </Pressable>
        <Pressable onPress={onShare} disabled={busy} style={[styles.shareBtn, busy && styles.off]}>
          <Text style={styles.shareLabel}>다른 앱으로 공유</Text>
        </Pressable>
      </View>
      <ColorSheet
        visible={colorTarget !== null}
        title={colorTarget === 'bg' ? '배경 색' : '글 색'}
        value={colorValue}
        onChange={(hex) => {
          if (colorTarget === 'bg') setDesign({ ...design, bg: hex });
          else if (sel && sel !== 'qr' && sel !== 'photo') setTextColor(sel, hex);
        }}
        onClose={() => setColorTarget(null)}
      />
    </View>
  );
}

function defaultTextDot(key: TextKey, d: PosterDesign, data: PosterData): string {
  const spec = TEMPLATES[d.template];
  if (spec.overPhoto && d.bg === undefined) return key === 'ment' ? '#ffd9cf' : key === 'name' ? '#ffffff' : '#f3e4df';
  return key === 'ment' ? data.accent : key === 'name' ? data.ink : data.soft;
}

function Sq({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.sq} hitSlop={4}>
      <Text style={styles.sqLabel}>{label}</Text>
    </Pressable>
  );
}

function Dot({ dot, on, multi, onPress }: { dot?: string; on: boolean; multi?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={5} style={[styles.dotWrap, on && styles.dotOn]}>
      {multi ? <LinearGradient colors={GRAD as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dot} /> : <View style={[styles.dot, { backgroundColor: dot }]} />}
    </Pressable>
  );
}

/** 옵션 칸 둘째 줄의 안내 (최소 크기 · 겹침). 같은 자리, 같은 폭. */
function MessageRow({ warn, countdown }: { warn: Warn; countdown: Animated.Value }) {
  if (!warn) return <View style={styles.row} />;
  const bad = warn.kind === 'bad';
  return (
    <View style={styles.row}>
      <View style={[styles.msg, bad ? styles.msgBad : styles.msgMin]}>
        <Text style={[styles.msgText, bad ? styles.msgTextBad : styles.msgTextMin]}>{warn.text}</Text>
        {bad ? <Animated.View style={[styles.bar, { width: countdown.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} /> : null}
      </View>
    </View>
  );
}

const PANEL_H = 84;

const styles = StyleSheet.create({
  root: { flex: 1 },
  hint: { height: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.screenX },
  hintText: { ...textStyle({ size: 'small', weight: 'semibold', color: color.accent.base }) },
  canvas: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  panel: {
    height: PANEL_H,
    marginHorizontal: space.screenX,
    marginBottom: space[3],
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.input,
    paddingHorizontal: space[5],
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  row: { height: 28, flexDirection: 'row', alignItems: 'center', gap: space[3] },
  rowTitle: { ...textStyle({ size: 'small', weight: 'semibold', color: color.ink.primary }), marginRight: space[2] },
  muted: { ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.muted }) },
  link: { ...textStyle({ size: 'small', weight: 'semibold', color: color.accent.base }) },
  spacer: { flex: 1 },
  sq: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: color.line.strong, backgroundColor: color.bg.surface, alignItems: 'center', justifyContent: 'center' },
  sqLabel: { ...textStyle({ size: 'small', weight: 'semibold', color: color.ink.primary }) },
  dotWrap: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dotOn: { borderWidth: 2, borderColor: color.accent.base },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)' },
  pbtn: { backgroundColor: color.ink.primary, borderRadius: 8, paddingHorizontal: 14, height: 28, justifyContent: 'center' },
  pbtnLabel: { ...textStyle({ size: 'small', weight: 'semibold', color: color.ink.onPrimary }) },
  msg: { flex: 1, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  msgMin: { backgroundColor: color.accent.tint },
  msgBad: { backgroundColor: color.status.errorTint },
  msgText: { ...textStyle({ size: 'small', weight: 'semibold' }) },
  msgTextMin: { color: color.accent.base },
  msgTextBad: { color: color.status.error },
  bar: { position: 'absolute', left: 0, bottom: 0, height: 3, backgroundColor: color.status.error },
  saveBar: { flexDirection: 'row', gap: space[3], paddingHorizontal: space.screenX, paddingBottom: space[6] },
  saveBtn: { flex: 1, backgroundColor: color.ink.primary, borderRadius: radius.button, paddingVertical: 13, alignItems: 'center' },
  saveLabel: { ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.onPrimary }) },
  shareBtn: { flex: 1, borderWidth: 1, borderColor: color.line.strong, backgroundColor: color.bg.surface, borderRadius: radius.button, paddingVertical: 13, alignItems: 'center' },
  shareLabel: { ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }) },
  off: { opacity: 0.5 },
});
