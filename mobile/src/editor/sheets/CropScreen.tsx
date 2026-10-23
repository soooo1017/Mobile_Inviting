/* eslint-disable react-hooks/refs -- PanResponder callbacks only read refs inside gesture events, never during render; the rule can't tell them apart from render code. */
import { useEffect, useRef, useState } from 'react';
import { Image, Modal, PanResponder, Pressable, Text, View, StyleSheet, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import { ModalSafeArea } from '../../components/ModalSafeArea';
import { color } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { frameAspect, photoRect } from '../canvas/PhotoFrame';
import type { Crop, ImageRatio, Photo } from '../types';

const RATIOS: { value: ImageRatio; label: string }[] = [
  { value: 'original', label: '원본' },
  { value: '1:1', label: '1:1' },
  { value: '4:5', label: '4:5' },
  { value: '3:4', label: '3:4' },
  { value: '16:9', label: '16:9' },
];
const MAX_SCALE = 4;

function touchDistance(e: GestureResponderEvent) {
  const [a, b] = e.nativeEvent.touches;
  if (!a || !b) return 0;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

/** 사진 위치 조정 (전체 화면): drag to move, pinch to zoom; outside the frame is dimmed. */
export function CropScreen({
  photo,
  ratio: initialRatio,
  crop: initialCrop,
  onCancel,
  onApply,
  aspect: fixedAspect,
}: {
  photo: Photo;
  ratio: ImageRatio;
  crop: Crop;
  onCancel: () => void;
  onApply: (crop: Crop, ratio: ImageRatio) => void;
  /** 틀의 가로 ÷ 세로가 정해져 있을 때(홍보물 사진 틀) — 비율 칩은 숨겨요. */
  aspect?: number;
}) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [ratio, setRatio] = useState(initialRatio);
  const [crop, setCrop] = useState(initialCrop);

  const aspect = fixedAspect ?? frameAspect(ratio, photo);
  let frameW = screenW * 0.78;
  let frameH = frameW / aspect;
  const maxH = screenH * 0.5;
  if (frameH > maxH) {
    frameH = maxH;
    frameW = frameH * aspect;
  }
  const rect = photoRect(photo, frameW, frameH, ratio === 'original' ? { x: 0, y: 0, scale: 1 } : crop);

  // Gesture bookkeeping lives in refs so the PanResponder (created once) sees fresh values.
  const live = useRef({ crop, frameW, frameH, ratio });
  useEffect(() => {
    live.current = { crop, frameW, frameH, ratio };
  });
  const start = useRef<{ crop: Crop; dist: number } | null>(null);

  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        start.current = { crop: live.current.crop, dist: touchDistance(e) };
      },
      onPanResponderMove: (e, g) => {
        const s = start.current;
        const { frameW: fw, frameH: fh, ratio: r } = live.current;
        if (!s || r === 'original') return;
        const dist = touchDistance(e);
        if (dist > 0) {
          if (!s.dist) s.dist = dist; // second finger joined mid-gesture
          const scale = Math.min(MAX_SCALE, Math.max(1, (s.crop.scale * dist) / s.dist));
          setCrop({ ...s.crop, scale });
        } else {
          setCrop({ ...s.crop, x: s.crop.x + g.dx / fw, y: s.crop.y + g.dy / fh });
        }
      },
      onPanResponderRelease: () => {
        // Snap the stored offsets to what's actually visible (the photo can't leave gaps in the frame).
        setCrop((c) => {
          const { frameW: fw, frameH: fh } = live.current;
          const r = photoRect(photo, fw, fh, c);
          return { scale: c.scale, x: (r.left - (fw - r.width) / 2) / fw, y: (r.top - (fh - r.height) / 2) / fh };
        });
        start.current = null;
      },
    }),
  );

  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <ModalSafeArea style={styles.screen}>
        <View style={styles.head}>
          <Pressable onPress={onCancel} hitSlop={10}>
            <Text style={styles.headSide}>취소</Text>
          </Pressable>
          <Text style={styles.headTitle}>사진 위치 조정</Text>
          <Pressable onPress={() => onApply(crop, ratio)} hitSlop={10}>
            <Text style={[styles.headSide, styles.apply]}>적용</Text>
          </Pressable>
        </View>

        <View style={styles.stage} {...responder.panHandlers}>
          <View style={{ width: frameW, height: frameH }}>
            <Image source={{ uri: photo.uri }} style={[styles.img, rect]} />
            {/* Dim everything outside the frame. */}
            <View pointerEvents="none" style={[styles.dim, { left: -2000, right: -2000, bottom: frameH, height: 2000 }]} />
            <View pointerEvents="none" style={[styles.dim, { left: -2000, right: -2000, top: frameH, height: 2000 }]} />
            <View pointerEvents="none" style={[styles.dim, { right: frameW, width: 2000, top: 0, bottom: 0 }]} />
            <View pointerEvents="none" style={[styles.dim, { left: frameW, width: 2000, top: 0, bottom: 0 }]} />
            <View pointerEvents="none" style={styles.frame}>
              <View style={[styles.gridV, { left: '33.3%' }]} />
              <View style={[styles.gridV, { left: '66.6%' }]} />
              <View style={[styles.gridH, { top: '33.3%' }]} />
              <View style={[styles.gridH, { top: '66.6%' }]} />
            </View>
          </View>
        </View>

        <Text style={styles.hint}>
          {ratio === 'original' ? '원본 비율은 사진 전체가 보여요' : '끌어서 위치를 맞추고, 두 손가락으로 확대해요'}
        </Text>
        <View style={styles.ratios}>
          {(fixedAspect ? [] : RATIOS).map((r) => {
            const on = r.value === ratio;
            return (
              <Pressable
                key={r.value}
                onPress={() => {
                  setRatio(r.value);
                  setCrop({ x: 0, y: 0, scale: 1 });
                }}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ModalSafeArea>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#141217',
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headSide: {
    ...textStyle({ size: 'control', weight: 'medium', color: '#d8d3df' }),
  },
  apply: {
    color: '#cdc6e0',
    fontFamily: 'Pretendard-SemiBold',
  },
  headTitle: {
    ...textStyle({ size: 'sheetTitle', weight: 'semibold', color: '#ffffff' }),
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: {
    position: 'absolute',
  },
  dim: {
    position: 'absolute',
    backgroundColor: 'rgba(10,9,12,0.62)',
  },
  frame: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  hint: {
    textAlign: 'center',
    ...textStyle({ size: 'label', weight: 'regular', color: '#b9b3c2' }),
    paddingVertical: 14,
  },
  ratios: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 24,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#4a4552',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipOn: {
    backgroundColor: color.select.fill,
    borderColor: color.select.fill,
  },
  chipLabel: {
    ...textStyle({ size: 'label', weight: 'medium', color: '#d8d3df' }),
  },
  chipLabelOn: {
    color: '#ffffff',
  },
});
