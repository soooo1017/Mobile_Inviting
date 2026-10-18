import { useState } from 'react';
import { Alert, Pressable, Text, View, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { TextField } from '../../components/TextField';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { EditorSheet } from '../EditorSheet';
import { Chips, GapTiles, Help, Section, SelectRow } from '../ui';
import { FontList, type SheetBase } from './common';
import { CropScreen } from './CropScreen';
import { PhotoFrame } from '../canvas/PhotoFrame';
import { isValidUrl } from '../canvas/BasicBlocks';
import { fontMeta } from '../fonts';
import { FORMAT_LABEL, newId, type BlockOfType, type BlockType, type DividerShape, type ImageRatio, type TextFormat } from '../types';

export type BlockSheetProps<T extends BlockType> = SheetBase & {
  block: BlockOfType<T>;
  onChange: (b: BlockOfType<T>) => void;
};
type Props<T extends BlockType> = BlockSheetProps<T>;

const FORMATS: TextFormat[] = ['h1', 'h2', 'h3', 'b1', 'b2'];

export function TextSheet({ block, onChange, onDone, defaultFont }: Props<'text'>) {
  const [page, setPage] = useState<'main' | 'font'>('main');
  const font = block.style?.font;
  const align = block.style?.align ?? 'center';
  const setStyle = (patch: Partial<NonNullable<typeof block.style>>) => onChange({ ...block, style: { ...block.style, ...patch } });

  if (page === 'font') {
    return (
      <EditorSheet title="글꼴" onBack={() => setPage('main')} onDone={onDone} maxHeight={0.7}>
        <FontList mode="block" value={font} defaultFont={defaultFont} onChange={(f) => setStyle({ font: f })} />
      </EditorSheet>
    );
  }

  return (
    <EditorSheet title="텍스트" onDone={onDone}>
      <Section label="서식">
        <Chips
          options={FORMATS.map((f) => ({ value: f, label: FORMAT_LABEL[f] }))}
          value={block.props.format}
          onChange={(format) => onChange({ ...block, props: { ...block.props, format } })}
        />
      </Section>
      <Section label="내용">
        <TextField
          value={block.props.content}
          onChangeText={(content) => onChange({ ...block, props: { ...block.props, content } })}
          placeholder="내용을 입력해주세요"
          multiline
          style={styles.multiline}
        />
      </Section>
      <Section label="정렬">
        <Chips
          options={[
            { value: 'left', label: '왼쪽' },
            { value: 'center', label: '가운데' },
            { value: 'right', label: '오른쪽' },
          ]}
          value={align}
          onChange={(a) => setStyle({ align: a })}
        />
      </Section>
      <Section label="글꼴">
        <SelectRow
          label={font ? fontMeta(font).label : `${fontMeta(defaultFont).label} · 기본 글꼴`}
          onPress={() => setPage('font')}
        />
      </Section>
    </EditorSheet>
  );
}

const RATIOS: { value: ImageRatio; label: string }[] = [
  { value: 'original', label: '원본' },
  { value: '1:1', label: '1:1' },
  { value: '4:5', label: '4:5' },
  { value: '3:4', label: '3:4' },
  { value: '16:9', label: '16:9' },
];

export async function pickPhotos(limit: number) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 0.85,
  });
  if (result.canceled) return [];
  return result.assets.map((a) => ({ id: newId('p'), uri: a.uri, width: a.width || 1000, height: a.height || 1250 }));
}

export function ImageSheet({ block, onChange, onDone }: Props<'image'>) {
  const [cropping, setCropping] = useState(false);
  const { photo, ratio, crop } = block.props;

  const choose = async () => {
    try {
      const [picked] = await pickPhotos(1);
      if (picked) onChange({ ...block, props: { ...block.props, photo: picked, crop: { x: 0, y: 0, scale: 1 } } });
    } catch {
      Alert.alert('사진을 불러오지 못했어요', '사진 접근 권한을 확인해주세요.');
    }
  };

  return (
    <>
      <EditorSheet title="이미지" onDone={onDone}>
        <View style={styles.pickRow}>
          <View style={styles.thumb}>{photo ? <PhotoFrame photo={photo} aspect={1} /> : null}</View>
          <View style={styles.pickText}>
            <Text style={styles.pickTitle}>{photo ? '사진 1장' : '사진 없음'}</Text>
            <Text style={styles.pickSub}>{photo ? '앨범에서 고른 사진' : '앨범에서 사진을 골라주세요'}</Text>
          </View>
          <Pressable onPress={choose} style={styles.ghostBtn}>
            <Text style={styles.ghostLabel}>{photo ? '사진 바꾸기' : '사진 고르기'}</Text>
          </Pressable>
        </View>
        <Section label="비율">
          <Chips options={RATIOS} value={ratio} onChange={(r) => onChange({ ...block, props: { ...block.props, ratio: r } })} />
          <Help>너비는 글과 같은 좌우 여백으로 맞춰요.</Help>
        </Section>
        <SelectRow label="사진 위치 조정" muted={!photo || ratio === 'original'} onPress={() => photo && ratio !== 'original' && setCropping(true)} />
      </EditorSheet>
      {cropping && photo ? (
        <CropScreen
          photo={photo}
          ratio={ratio}
          crop={crop}
          onCancel={() => setCropping(false)}
          onApply={(next, nextRatio) => {
            onChange({ ...block, props: { ...block.props, crop: next, ratio: nextRatio } });
            setCropping(false);
          }}
        />
      ) : null}
    </>
  );
}

const SHAPES: { value: DividerShape; label: string }[] = [
  { value: 'line', label: '선' },
  { value: 'dashed', label: '점선' },
  { value: 'dots', label: '점' },
  { value: 'heart', label: '하트' },
];

function ShapeSample({ shape, on }: { shape: DividerShape; on: boolean }) {
  const c = on ? '#ffffff' : color.ink.secondary;
  if (shape === 'line') return <View style={[styles.sampleLine, { backgroundColor: c }]} />;
  if (shape === 'dashed')
    return (
      <View style={styles.sampleDashClip}>
        <View style={[styles.sampleDash, { borderColor: c }]} />
      </View>
    );
  return <Text style={[styles.sampleText, { color: c }]}>{shape === 'dots' ? '· · ·' : '— ♥ —'}</Text>;
}

export function DividerSheet({ block, onChange, onDone }: Props<'divider'>) {
  return (
    <EditorSheet title="구분선" onDone={onDone}>
      <Section label="모양">
        <View style={styles.shapeRow}>
          {SHAPES.map((s) => {
            const on = block.props.shape === s.value;
            return (
              <Pressable
                key={s.value}
                onPress={() => onChange({ ...block, props: { ...block.props, shape: s.value } })}
                style={[styles.shapeTile, on && styles.shapeTileOn]}
              >
                <View style={styles.sampleBox}>
                  <ShapeSample shape={s.value} on={on} />
                </View>
                <Text style={[styles.shapeLabel, on && styles.shapeLabelOn]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>
      <Section label="길이">
        <Chips
          options={[
            { value: 'short', label: '짧게' },
            { value: 'long', label: '길게' },
          ]}
          value={block.props.length}
          onChange={(length) => onChange({ ...block, props: { ...block.props, length } })}
        />
      </Section>
    </EditorSheet>
  );
}

export function SpacerSheet({ block, onChange, onDone }: Props<'spacer'>) {
  return (
    <EditorSheet title="여백" onDone={onDone}>
      <Section label="높이">
        <GapTiles value={block.props.height} onChange={(height) => onChange({ ...block, props: { height } })} />
        <Help>게스트에게는 빈 공간으로 보이고, 편집 화면에서만 점선 칸으로 보여요.</Help>
      </Section>
    </EditorSheet>
  );
}

export function ButtonSheet({ block, onChange, onDone }: Props<'button'>) {
  const p = block.props;
  const set = (patch: Partial<typeof p>) => onChange({ ...block, props: { ...p, ...patch } });
  const urlProblem = p.url.trim() === '' ? 'empty' : isValidUrl(p.url) ? null : 'invalid';
  return (
    <EditorSheet title="버튼" onDone={onDone}>
      <Section label="버튼 문구">
        <TextField value={p.label} onChangeText={(label) => set({ label })} placeholder="예: 웨딩 사진 더 보기" maxLength={24} />
      </Section>
      <Section label="연결할 주소">
        <TextField
          value={p.url}
          onChangeText={(url) => set({ url })}
          placeholder="https://"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          error={urlProblem === 'invalid'}
        />
        <Help error={urlProblem === 'invalid'}>
          {urlProblem === 'invalid' ? '주소 형식이 맞지 않아요. https:// 로 시작하는 주소를 넣어주세요' : 'https:// 로 시작하는 주소를 넣어주세요'}
        </Help>
      </Section>
      <Section label="모양">
        <Chips
          options={[
            { value: 'fill', label: '채움' },
            { value: 'outline', label: '테두리' },
          ]}
          value={p.shape}
          onChange={(shape) => set({ shape })}
        />
      </Section>
      <Section label="너비">
        <Chips
          options={[
            { value: 'full', label: '꽉 차게' },
            { value: 'hug', label: '글자만큼' },
          ]}
          value={p.width}
          onChange={(width) => set({ width })}
        />
        <Help>색은 배경 테마를 따라가요.</Help>
      </Section>
    </EditorSheet>
  );
}

const styles = StyleSheet.create({
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    padding: space[4],
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: color.bg.placeholderFill,
  },
  pickText: {
    flex: 1,
  },
  pickTitle: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }),
  },
  pickSub: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    marginTop: 2,
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: color.line.chip,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: color.bg.surface,
  },
  ghostLabel: {
    ...textStyle({ size: 'small', weight: 'semibold', color: color.ink.primary }),
  },
  shapeRow: {
    flexDirection: 'row',
    gap: space[3],
  },
  shapeTile: {
    flex: 1,
    alignItems: 'center',
    gap: space[4],
    borderWidth: 1,
    borderColor: color.line.chip,
    backgroundColor: color.bg.surface,
    borderRadius: radius.button,
    paddingTop: space[6],
    paddingBottom: space[4],
  },
  shapeTileOn: {
    backgroundColor: color.select.fill,
    borderColor: color.select.fill,
  },
  sampleBox: {
    height: 16,
    width: '70%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleLine: {
    width: '100%',
    height: 1.5,
  },
  sampleDashClip: {
    width: '100%',
    height: 1.5,
    overflow: 'hidden',
  },
  sampleDash: {
    height: 5,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  sampleText: {
    ...textStyle({ size: 'small', weight: 'semibold' }),
  },
  shapeLabel: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.primary }),
  },
  shapeLabelOn: {
    color: color.select.on,
  },
});
