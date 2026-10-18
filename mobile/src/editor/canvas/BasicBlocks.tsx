import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCanvas } from './CanvasContext';
import { InvText, InvUiText } from './InvText';
import { PhotoFrame, frameAspect } from './PhotoFrame';
import { FORMAT_SIZE, GAP_LABEL, SPACER_HEIGHT, type BlockOfType, type Photo } from '../types';

export function TextBlockView({ block }: { block: BlockOfType<'text'> }) {
  const { mode } = useCanvas();
  const { format, content } = block.props;
  const heading = format === 'h1' || format === 'h2' || format === 'h3';
  const align = block.style?.align ?? 'center';
  const empty = !content.trim();
  if (empty && mode === 'preview') return null;
  return (
    <InvText
      font={block.style?.font}
      size={FORMAT_SIZE[format]}
      bold={heading}
      leading={heading ? 1.35 : 1.7}
      soft={empty || format === 'b2'}
      style={{ textAlign: align, opacity: empty ? 0.6 : 1 }}
    >
      {empty ? '내용을 입력해주세요' : content}
    </InvText>
  );
}

function EmptyPhoto({ label }: { label: string }) {
  const { theme } = useCanvas();
  return (
    <View style={[styles.emptyPhoto, { borderColor: theme.rule }]}>
      <InvUiText size={13} soft>
        {label}
      </InvUiText>
    </View>
  );
}

export function ImageBlockView({ block }: { block: BlockOfType<'image'> }) {
  const { mode } = useCanvas();
  const { photo, ratio, crop } = block.props;
  if (!photo) return mode === 'edit' ? <EmptyPhoto label="사진을 추가해주세요" /> : null;
  // Width is fixed to the text margins (확정: 여백 있게 하나로).
  return <PhotoFrame photo={photo} aspect={frameAspect(ratio, photo)} crop={ratio === 'original' ? undefined : crop} radius={2} />;
}

export function GalleryBlockView({ block }: { block: BlockOfType<'gallery'> }) {
  const { mode, theme } = useCanvas();
  const { photos, layout, zoomOnTap } = block.props;
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);

  if (!photos.length) return mode === 'edit' ? <EmptyPhoto label="갤러리에 사진을 추가해주세요" /> : null;

  const open = mode === 'preview' && zoomOnTap ? (i: number) => setViewerIndex(i) : undefined;

  let body;
  if (layout === 'single') {
    body = (
      <View style={styles.galleryColumn}>
        {photos.map((p, i) => (
          <Pressable key={p.id} onPress={open ? () => open(i) : undefined} disabled={!open}>
            <PhotoFrame photo={p} aspect={p.width / p.height} radius={2} />
          </Pressable>
        ))}
      </View>
    );
  } else if (layout === 'grid') {
    body = (
      <View style={styles.grid}>
        {photos.map((p, i) => (
          <Pressable key={p.id} style={styles.gridCell} onPress={open ? () => open(i) : undefined} disabled={!open}>
            <PhotoFrame photo={p} aspect={1} radius={2} />
          </Pressable>
        ))}
      </View>
    );
  } else {
    const itemW = slideWidth * 0.84;
    body = (
      <View onLayout={(e) => setSlideWidth(e.nativeEvent.layout.width)}>
        {slideWidth > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={itemW + 8}
            decelerationRate="fast"
            scrollEnabled={mode === 'preview' || photos.length > 1}
            onMomentumScrollEnd={(e) => setSlide(Math.round(e.nativeEvent.contentOffset.x / (itemW + 8)))}
            contentContainerStyle={{ gap: 8 }}
          >
            {photos.map((p, i) => (
              <Pressable key={p.id} style={{ width: itemW }} onPress={open ? () => open(i) : undefined} disabled={!open}>
                <PhotoFrame photo={p} aspect={4 / 5} radius={2} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        <View style={styles.dots}>
          {photos.slice(0, 8).map((p, i) => (
            <View key={p.id} style={[styles.dot, { backgroundColor: i === Math.min(slide, 7) ? theme.ink : theme.rule }]} />
          ))}
          <InvUiText size={11} soft style={styles.dotCount}>
            {`${slide + 1} / ${photos.length}`}
          </InvUiText>
        </View>
      </View>
    );
  }

  return (
    <>
      {body}
      {viewerIndex !== null ? <PhotoViewer photos={photos} start={viewerIndex} onClose={() => setViewerIndex(null)} /> : null}
    </>
  );
}

function PhotoViewer({ photos, start, onClose }: { photos: Photo[]; start: number; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(start);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewer}>
        <ScrollView
          horizontal
          pagingEnabled
          contentOffset={{ x: start * width, y: 0 }}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          showsHorizontalScrollIndicator={false}
        >
          {photos.map((p) => (
            <View key={p.id} style={{ width, height, justifyContent: 'center' }}>
              <PhotoFrame photo={p} aspect={p.width / p.height} />
            </View>
          ))}
        </ScrollView>
        <View style={[styles.viewerTop, { top: insets.top + 12 }]}>
          <Text style={styles.viewerCount}>{`${index + 1} / ${photos.length}`}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.viewerClose}>✕</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function DividerBlockView({ block }: { block: BlockOfType<'divider'> }) {
  const { theme } = useCanvas();
  const { shape, length } = block.props;
  const width = length === 'short' ? '30%' : '72%';
  if (shape === 'dots') {
    return (
      <InvUiText size={18} style={[styles.centerText, { color: theme.accent, letterSpacing: 6 }]}>
        · · ·
      </InvUiText>
    );
  }
  if (shape === 'heart') {
    return (
      <View style={[styles.heartRow, { width }]}>
        <View style={[styles.heartLine, { backgroundColor: theme.rule }]} />
        <InvUiText size={12} style={{ color: theme.accent }}>
          ♥
        </InvUiText>
        <View style={[styles.heartLine, { backgroundColor: theme.rule }]} />
      </View>
    );
  }
  if (shape === 'dashed') {
    // A one-sided dashed border renders solid on iOS, so clip a dashed box down to its top edge.
    return (
      <View style={[styles.dashClip, { width }]}>
        <View style={[styles.dashBox, { borderColor: theme.accent }]} />
      </View>
    );
  }
  return <View style={[styles.line, { width, backgroundColor: theme.rule }]} />;
}

export function SpacerBlockView({ block }: { block: BlockOfType<'spacer'> }) {
  const { mode, theme } = useCanvas();
  const height = SPACER_HEIGHT[block.props.height];
  if (mode === 'preview') return <View style={{ height }} />;
  // Guests just see empty space; only the editor shows the dashed box so it can be tapped.
  return (
    <View style={[styles.spacerEdit, { height, borderColor: theme.rule }]}>
      <View style={[styles.spacerTag, { backgroundColor: theme.paper }]}>
        <InvUiText size={11} soft>{`여백 · ${GAP_LABEL[block.props.height]}`}</InvUiText>
      </View>
    </View>
  );
}

export function isValidUrl(url: string): boolean {
  return /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(url.trim());
}

export function InvButton({
  label,
  tone,
  hug,
  onPress,
  icon,
  disabled,
}: {
  label: string;
  tone: 'fill' | 'outline';
  hug?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  const { theme } = useCanvas();
  const fill = tone === 'fill';
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || disabled}
      style={[
        styles.button,
        hug && styles.buttonHug,
        fill ? { backgroundColor: theme.ink } : { borderWidth: 1, borderColor: theme.ink },
        disabled && { opacity: 0.45 },
      ]}
    >
      {icon}
      <InvUiText size={14} bold style={{ color: fill ? theme.paper : theme.ink }}>
        {label}
      </InvUiText>
    </Pressable>
  );
}

export function ButtonBlockView({ block }: { block: BlockOfType<'button'> }) {
  const { mode } = useCanvas();
  const { label, url, shape, width } = block.props;
  if (!label.trim() && mode === 'preview') return null;
  const go = mode === 'preview' && isValidUrl(url) ? () => Linking.openURL(url.trim()) : undefined;
  return <InvButton label={label.trim() || '버튼 문구를 입력해주세요'} tone={shape === 'fill' ? 'fill' : 'outline'} hug={width === 'hug'} onPress={go} />;
}

const styles = StyleSheet.create({
  emptyPhoto: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 6,
    paddingVertical: 36,
    alignItems: 'center',
  },
  galleryColumn: {
    gap: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gridCell: {
    width: '48.7%',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotCount: {
    marginLeft: 6,
  },
  viewer: {
    flex: 1,
    backgroundColor: '#0d0c10',
  },
  viewerTop: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewerCount: {
    color: '#d8d3df',
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
  },
  viewerClose: {
    color: '#ffffff',
    fontSize: 20,
  },
  centerText: {
    textAlign: 'center',
  },
  heartRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heartLine: {
    flex: 1,
    height: 1,
  },
  line: {
    alignSelf: 'center',
    height: 1,
  },
  dashClip: {
    alignSelf: 'center',
    height: 1,
    overflow: 'hidden',
  },
  dashBox: {
    height: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  spacerEdit: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacerTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  buttonHug: {
    alignSelf: 'center',
  },
});
