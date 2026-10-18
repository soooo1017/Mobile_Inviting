/* eslint-disable react-hooks/refs -- PanResponder callbacks only read refs inside gesture events, never during render; the rule can't tell them apart from render code. */
import { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Animated, PanResponder, Pressable, Text, View, StyleSheet } from 'react-native';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { FullScreenEditor, ScrollLockContext } from '../EditorSheet';
import { Chips, Help, Section, ToggleList } from '../ui';
import { PhotoFrame } from '../canvas/PhotoFrame';
import { PhotoIcon } from '../icons';
import { pickPhotos, type BlockSheetProps } from './BasicSheets';
import { LIMITS, type GalleryLayout, type Photo } from '../types';

const COLS = 3;
const GAP = 6;

/** 갤러리 편집 (전체 화면): 여러 장 추가 · 꾹 눌러 순서 바꾸기 · ×로 빼기. */
export function GalleryEditor({ block, onChange, onDone }: BlockSheetProps<'gallery'>) {
  const p = block.props;
  const set = (patch: Partial<typeof p>) => onChange({ ...block, props: { ...p, ...patch } });

  const add = async () => {
    const remaining = LIMITS.galleryPhotos - p.photos.length;
    if (remaining <= 0) return;
    try {
      const picked = await pickPhotos(remaining);
      if (picked.length) set({ photos: [...p.photos, ...picked].slice(0, LIMITS.galleryPhotos) });
    } catch {
      Alert.alert('사진을 불러오지 못했어요', '사진 접근 권한을 확인해주세요.');
    }
  };

  return (
    <FullScreenEditor visible title={`갤러리 · 사진 ${p.photos.length}장`} onClose={onDone} onDone={onDone}>
      <Section label="레이아웃">
        <Chips<GalleryLayout>
          options={[
            { value: 'single', label: '1열' },
            { value: 'grid', label: '2열 그리드' },
            { value: 'slide', label: '슬라이드' },
          ]}
          value={p.layout}
          onChange={(layout) => set({ layout })}
        />
      </Section>
      <Section label="사진" sub={`꾹 눌러 순서 바꾸기 · 최대 ${LIMITS.galleryPhotos}장`}>
        <PhotoGrid photos={p.photos} onAdd={add} onChange={(photos) => set({ photos })} />
      </Section>
      <View>
        <ToggleList items={[{ key: 'zoom', label: '탭하면 크게 보기', value: p.zoomOnTap, onChange: (zoomOnTap) => set({ zoomOnTap }) }]} />
        <View style={styles.help}>
          <Help>게스트가 사진을 누르면 크게 넘겨 볼 수 있어요.</Help>
        </View>
      </View>
    </FullScreenEditor>
  );
}

function PhotoGrid({ photos, onAdd, onChange }: { photos: Photo[]; onAdd: () => void; onChange: (p: Photo[]) => void }) {
  const [width, setWidth] = useState(0);
  const cell = width ? (width - GAP * (COLS - 1)) / COLS : 0;
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);
  const dragRef = useRef<{ from: number; to: number } | null>(null);
  const granted = useRef(false);
  const [delta] = useState(() => new Animated.ValueXY());
  const lockScroll = useContext(ScrollLockContext);
  // Gesture handlers read the latest values through this ref (kept in sync after each render).
  const live = useRef({ photos, onChange, cell, lockScroll });
  useEffect(() => {
    live.current = { photos, onChange, cell, lockScroll };
  });

  // Grid position 0 is the "사진 추가" tile; photo i sits at position i + 1.
  const slotPos = (slot: number, c: number) => ({ left: (slot % COLS) * (c + GAP), top: Math.floor(slot / COLS) * (c + GAP) });

  const finish = () => {
    const d = dragRef.current;
    dragRef.current = null;
    granted.current = false;
    setDrag(null);
    delta.setValue({ x: 0, y: 0 });
    live.current.lockScroll(false);
    if (d && d.from !== d.to) {
      const next = [...live.current.photos];
      const [moved] = next.splice(d.from, 1);
      next.splice(d.to, 0, moved);
      live.current.onChange(next);
    }
  };

  const [responder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: () => dragRef.current !== null,
      onPanResponderGrant: () => {
        granted.current = true;
      },
      onPanResponderMove: (_e, g) => {
        const d = dragRef.current;
        if (!d) return;
        delta.setValue({ x: g.dx, y: g.dy });
        const c = live.current.cell;
        const origin = slotPos(d.from + 1, c);
        const cx = origin.left + c / 2 + g.dx;
        const cy = origin.top + c / 2 + g.dy;
        const col = Math.max(0, Math.min(COLS - 1, Math.floor(cx / (c + GAP))));
        const row = Math.max(0, Math.floor(cy / (c + GAP)));
        const to = Math.max(0, Math.min(live.current.photos.length - 1, row * COLS + col - 1));
        if (to !== d.to) {
          dragRef.current = { from: d.from, to };
          setDrag({ from: d.from, to });
        }
      },
      onPanResponderRelease: () => finish(),
      onPanResponderTerminate: () => finish(),
      onPanResponderTerminationRequest: () => false,
    }),
  );

  // Order shown while dragging: the lifted photo's slot moves to the target.
  const order = photos.map((_, i) => i);
  if (drag) {
    const [moved] = order.splice(drag.from, 1);
    order.splice(drag.to, 0, moved);
  }
  const rows = Math.ceil((photos.length + 1) / COLS);

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: cell ? rows * cell + (rows - 1) * GAP : 0 }}
      {...responder.panHandlers}
    >
      {cell ? (
        <>
          <Pressable
            onPress={onAdd}
            disabled={photos.length >= LIMITS.galleryPhotos}
            style={[styles.addTile, { width: cell, height: cell }, photos.length >= LIMITS.galleryPhotos && styles.addOff]}
          >
            <PhotoIcon color={color.accent.base} />
            <Text style={styles.addLabel}>사진 추가</Text>
          </Pressable>
          {drag ? (
            <View pointerEvents="none" style={[styles.dropBox, { width: cell, height: cell }, slotPos(drag.to + 1, cell)]} />
          ) : null}
          {photos.map((photo, i) => {
            const dragging = drag?.from === i;
            const slot = dragging ? i + 1 : order.indexOf(i) + 1;
            return (
              <Animated.View
                key={photo.id}
                style={[
                  styles.cell,
                  { width: cell, height: cell },
                  slotPos(slot, cell),
                  dragging && [styles.lifted, { transform: [...delta.getTranslateTransform(), { scale: 1.05 }] }],
                ]}
              >
                <Pressable
                  onLongPress={() => {
                    dragRef.current = { from: i, to: i };
                    setDrag({ from: i, to: i });
                    lockScroll(true);
                  }}
                  onPressOut={() =>
                    setTimeout(() => {
                      if (dragRef.current && !granted.current) finish();
                    }, 60)
                  }
                  delayLongPress={280}
                  style={styles.fill}
                >
                  <PhotoFrame photo={photo} aspect={1} radius={6} />
                </Pressable>
                <Pressable
                  onPress={() => onChange(photos.filter((x) => x.id !== photo.id))}
                  hitSlop={8}
                  style={styles.remove}
                  accessibilityLabel="사진 빼기"
                >
                  <Text style={styles.removeMark}>✕</Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  help: {
    marginTop: space[3],
  },
  addTile: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: color.accent.tintBorder,
    backgroundColor: color.accent.tint,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addOff: {
    opacity: 0.5,
  },
  addLabel: {
    ...textStyle({ size: 'small', weight: 'semibold', color: color.accent.base }),
  },
  cell: {
    position: 'absolute',
    borderRadius: 6,
  },
  fill: {
    flex: 1,
  },
  lifted: {
    zIndex: 10,
    elevation: 8,
    shadowColor: '#23212a',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  dropBox: {
    position: 'absolute',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: color.accent.base,
    borderRadius: radius.cell,
  },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(20,18,23,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMark: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
