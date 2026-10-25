import { hostNames } from '../editor/format';
import { Image, Pressable, Text, View, StyleSheet, type GestureResponderHandlers, type LayoutRectangle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { photoRect } from '../editor/canvas/PhotoFrame';
import { useFontFamily } from '../editor/fonts';
import { autoTextColor, isDarkColor, mix } from '../editor/colors';
import { invitationTheme } from '../editor/invitationTheme';
import type { FontId, Photo } from '../editor/types';
import type { Project } from '../types/project';
import { shareUrl } from '../share/link';
import {
  isMoved,
  photoFrame,
  posterDateText,
  qrBox,
  qrRect,
  qrSize,
  TEMPLATES,
  visibleTextKeys,
  type ElKey,
  type PosterDesign,
  type Rect,
  type TextKey,
} from './model';

/** 홍보물에 들어가는 값 (초대장 · 행사 정보에서 가져와요). */
export type PosterData = {
  names: string;
  dateText: string;
  place: string;
  address: string;
  photo?: Photo;
  fontId: FontId;
  qrUrl: string;
  bg: string;
  /** 초대장 자체의 바탕색 (배경 색을 바꾸지 않았을 때의 색). */
  themeBg: string;
  ink: string;
  soft: string;
  accent: string;
  /** QR 카드 바탕이 초대장 바탕이 아니라 흰색이어야 하는지 (진한 바탕 · 사진 위). */
  qrWhite: boolean;
};

export function buildPosterData(project: Project, design: PosterDesign, fontId: FontId, photo: Photo | undefined): PosterData {
  const theme = invitationTheme(project);
  const spec = TEMPLATES[design.template];
  const bg = design.bg ?? theme.paper;
  const custom = design.bg !== undefined;
  const ink = custom ? autoTextColor(bg) : theme.ink;
  const soft = custom ? mix(ink, bg, 0.3) : theme.inkSoft;
  const names = hostNames(project.eventType, project.hosts) || project.title;
  const photoRectOnCard = photoFrame(design);
  const q = qrRect(design);
  const overPhoto = spec.photo.fixed || (q.x < photoRectOnCard.x + photoRectOnCard.w && photoRectOnCard.x < q.x + q.w && q.y < photoRectOnCard.y + photoRectOnCard.h && photoRectOnCard.y < q.y + q.h);
  return {
    names,
    dateText: posterDateText(project.eventAt),
    place: project.venue?.name ?? '',
    address: project.venue?.address ?? '',
    photo,
    fontId,
    qrUrl: shareUrl(project),
    bg,
    themeBg: theme.paper,
    ink,
    soft,
    accent: custom ? ink : theme.accentInk,
    qrWhite: isDarkColor(bg) || overPhoto,
  };
}

export type EditProps = {
  selected: ElKey | null;
  bad: ElKey[];
  responders: Record<ElKey, GestureResponderHandlers>;
  corners?: Record<'tl' | 'tr' | 'bl' | 'br', GestureResponderHandlers>;
  guides: { x: boolean; y: boolean };
  onBackground: () => void;
  onTextLayout: (key: TextKey, rect: LayoutRectangle, inFlow: boolean) => void;
  onGroupLayout: (rect: LayoutRectangle) => void;
};

const ACCENT_EDIT = '#5f5486';
const BAD = '#e0506a';

function textDefaults(key: TextKey, d: PosterDesign, data: PosterData): { color: string; bold: boolean } {
  const spec = TEMPLATES[d.template];
  if (spec.overPhoto && d.bg === undefined) {
    return { color: key === 'ment' ? '#ffd9cf' : key === 'name' ? '#ffffff' : '#f3e4df', bold: key === 'name' || key === 'ment' };
  }
  return { color: key === 'ment' ? data.accent : key === 'name' ? data.ink : data.soft, bold: key === 'name' || key === 'ment' };
}

/** 홍보물 한 장 — 템플릿의 기본 크기(base 단위)로 그려요. 보여줄 때는 ScaledBox로 줄이고, 저장할 때는 이 크기 그대로 찍어요. */
export function PosterArt({ design, data, edit }: { design: PosterDesign; data: PosterData; edit?: EditProps }) {
  const spec = TEMPLATES[design.template];
  const family = useFontFamily(data.fontId, false);
  const familyBold = useFontFamily(data.fontId, true);
  const frame = photoFrame(design);
  const visible = visibleTextKeys(design);
  const flow = visible.filter((k) => !isMoved(design.text[k]));
  const moved = visible.filter((k) => isMoved(design.text[k]));
  const q = qrRect(design);
  const qsize = qrSize(design);

  const textNode = (k: TextKey) => {
    const st = design.text[k];
    const def = textDefaults(k, design, data);
    const size = spec.fonts[k] * st.scale;
    const content = k === 'ment' ? design.ment.trim() : k === 'name' ? data.names : k === 'date' ? data.dateText : data.place;
    return (
      <>
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: def.bold ? familyBold : family,
            fontSize: size,
            lineHeight: Math.round(size * 1.35),
            letterSpacing: k === 'ment' ? 1 : 0,
            color: st.color ?? def.color,
            textAlign: spec.group.align === 'center' ? 'center' : 'left',
          }}
        >
          {content}
        </Text>
        {k === 'place' && design.show.address && data.address ? (
          <Text
            allowFontScaling={false}
            style={{ fontFamily: family, fontSize: size * 0.85, lineHeight: Math.round(size * 0.85 * 1.35), color: st.color ?? def.color, textAlign: spec.group.align === 'center' ? 'center' : 'left' }}
          >
            {data.address}
          </Text>
        ) : null}
      </>
    );
  };

  const outline = (k: ElKey, inset = -3) => {
    if (!edit) return null;
    const isBad = edit.bad.includes(k);
    const selected = edit.selected === k;
    return (
      <View
        pointerEvents="none"
        style={[
          styles.outline,
          { left: inset, top: inset, right: inset, bottom: inset },
          isBad ? { borderColor: BAD, borderWidth: 2, backgroundColor: 'rgba(224,80,106,0.12)' } : selected ? { borderColor: ACCENT_EDIT, borderWidth: 2, backgroundColor: 'rgba(95,84,134,0.10)' } : { borderColor: ACCENT_EDIT, borderWidth: 1, borderStyle: 'dashed', opacity: 0.55 },
        ]}
      >
        {selected && !isBad ? (
          <View style={styles.badge}>
            <Text style={styles.badgeGlyph}>✥</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const wrapText = (k: TextKey, inFlow: boolean) => {
    const st = design.text[k];
    const positionStyle = inFlow ? null : ({ position: 'absolute', left: st.x, top: st.y } as const);
    return (
      <View
        key={k}
        {...(edit ? edit.responders[k] : {})}
        onLayout={edit ? (e) => edit.onTextLayout(k, e.nativeEvent.layout, inFlow) : undefined}
        style={[positionStyle, inFlow ? { alignSelf: spec.group.align, marginBottom: 6 } : null]}
      >
        {textNode(k)}
        {outline(k)}
      </View>
    );
  };

  const groupStyle = {
    position: 'absolute' as const,
    left: spec.group.left,
    right: spec.group.right,
    top: spec.group.top,
    bottom: spec.group.bottom,
    justifyContent: spec.group.bottom !== undefined ? ('flex-end' as const) : ('flex-start' as const),
  };

  const qrCard = data.qrWhite ? '#ffffff' : data.bg;

  return (
    <View style={{ width: spec.w, height: spec.h, backgroundColor: data.bg, overflow: 'hidden' }}>
      {edit ? <Pressable style={StyleSheet.absoluteFill} onPress={edit.onBackground} accessibilityLabel="선택 해제" /> : null}

      {/* 사진 */}
      <View
        {...(edit ? edit.responders.photo : {})}
        style={{ position: 'absolute', left: frame.x, top: frame.y, width: frame.w, height: frame.h, borderRadius: spec.photo.radius, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.08)' }}
      >
        {data.photo ? <Image source={{ uri: data.photo.uri }} style={[styles.abs, photoRect(data.photo, frame.w, frame.h, design.crop)]} /> : null}
        {!data.photo ? (
          <View style={styles.noPhoto}>
            <Text style={styles.noPhotoText}>사진 없음</Text>
          </View>
        ) : null}
        {edit ? (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill]}>
            {outline('photo', 0)}
          </View>
        ) : null}
      </View>
      {spec.overPhoto && data.photo ? (
        <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0)', 'rgba(30,18,16,0.78)']} start={{ x: 0.5, y: 0.38 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
      ) : null}
      {edit?.selected === 'photo' && edit.corners && !spec.photo.fixed
        ? (['tl', 'tr', 'bl', 'br'] as const).map((c) => (
            <View
              key={c}
              {...edit.corners![c]}
              hitSlop={10}
              style={[
                styles.corner,
                { left: Math.min(Math.max((c === 'tl' || c === 'bl' ? frame.x : frame.x + frame.w) - 8, 0), spec.w - 16), top: Math.min(Math.max((c === 'tl' || c === 'tr' ? frame.y : frame.y + frame.h) - 8, 0), spec.h - 16) },
              ]}
            />
          ))
        : null}

      {/* 글 — 템플릿 기본 줄 */}
      <View pointerEvents="box-none" style={groupStyle} onLayout={edit ? (e) => edit.onGroupLayout(e.nativeEvent.layout) : undefined}>
        {flow.map((k) => wrapText(k, true))}
      </View>
      {/* 글 — 직접 옮긴 것 */}
      {moved.map((k) => wrapText(k, false))}

      {/* QR */}
      <View
        {...(edit ? edit.responders.qr : {})}
        style={[styles.qr, { left: q.x, top: q.y, width: q.w, height: q.h, backgroundColor: qrCard }]}
      >
        <QRCode value={data.qrUrl} size={qsize} color="#111111" backgroundColor={qrCard} ecl="M" quietZone={0} />
        <Text allowFontScaling={false} numberOfLines={1} style={[styles.qrCaption, { color: data.qrWhite || !isDarkColor(data.bg) ? '#555555' : '#dddddd' }]}>
          초대장 보기
        </Text>
        {outline('qr')}
      </View>

      {edit?.guides.x ? <View pointerEvents="none" style={[styles.guideV, { left: spec.w / 2 - 0.75 }]} /> : null}
      {edit?.guides.y ? <View pointerEvents="none" style={[styles.guideH, { top: spec.h / 2 - 0.75 }]} /> : null}
    </View>
  );
}

/** base 크기 그대로 그린 홍보물을 화면 크기에 맞게 줄여 보여줘요. */
export function ScaledBox({ w, h, scale, children }: { w: number; h: number; scale: number; children: React.ReactNode }) {
  return (
    <View style={{ width: w * scale, height: h * scale, overflow: 'hidden' }}>
      <View style={{ width: w, height: h, transform: [{ translateX: (-w * (1 - scale)) / 2 }, { translateY: (-h * (1 - scale)) / 2 }, { scale }] }}>{children}</View>
    </View>
  );
}

export function rectOf(e: LayoutRectangle): Rect {
  return { x: e.x, y: e.y, w: e.width, h: e.height };
}

export { qrBox };

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  outline: {
    position: 'absolute',
    left: -3,
    top: -3,
    right: -3,
    bottom: -3,
    borderRadius: 3,
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -10,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ACCENT_EDIT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGlyph: { color: '#ffffff', fontSize: 10, lineHeight: 12 },
  noPhoto: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  noPhotoText: { color: 'rgba(0,0,0,0.35)', fontSize: 12 },
  qr: { position: 'absolute', alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 6, paddingVertical: 6 },
  qrCaption: { fontSize: 8, lineHeight: 12, fontFamily: 'Pretendard-Regular' },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: ACCENT_EDIT,
    zIndex: 5,
  },
  guideV: { position: 'absolute', top: 0, bottom: 0, width: 1.5, backgroundColor: BAD, opacity: 0.8 },
  guideH: { position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: BAD, opacity: 0.8 },
});
