import { Pressable, Text, View, StyleSheet } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { BLOCK_LABEL, type BlockType } from './types';

type Tile = { type: BlockType | 'map'; glyph: string };

const CATEGORIES: { name: string; tiles: Tile[] }[] = [
  {
    name: '기본',
    tiles: [
      { type: 'text', glyph: 'T' },
      { type: 'image', glyph: '▣' },
      { type: 'gallery', glyph: '▦' },
      { type: 'divider', glyph: '—' },
      { type: 'spacer', glyph: '↕' },
      { type: 'button', glyph: '▭' },
    ],
  },
  {
    name: '연락 · 위치',
    tiles: [
      { type: 'phone', glyph: '☎' },
      { type: 'email', glyph: '✉' },
      { type: 'map', glyph: '⌖' },
    ],
  },
  {
    name: '기능',
    tiles: [
      { type: 'datetime', glyph: '▤' },
      { type: 'rsvp', glyph: '✓' },
      { type: 'guestbook', glyph: '✎' },
      { type: 'account', glyph: '₩' },
    ],
  },
];

type Props = {
  visible: boolean;
  /** "맨 아래에 추가돼요" / "“제목3 · …” 아래에 추가돼요" */
  where: string;
  onPick: (type: BlockType) => void;
  onClose: () => void;
};

/** Same sheet whether opened from the editor's bottom button or a "+" in 순서 편집. */
export function AddBlockSheet({ visible, where, onPick, onClose }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="추가하기">
      <Text style={styles.where}>{where}</Text>
      <View style={styles.body}>
        {CATEGORIES.map((cat) => (
          <View key={cat.name} style={styles.cat}>
            <Text style={styles.catName}>{cat.name}</Text>
            <View style={styles.tiles}>
              {cat.tiles.map((t) => {
                const later = t.type === 'map';
                return (
                  <Pressable
                    key={t.type}
                    disabled={later}
                    onPress={() => t.type !== 'map' && onPick(t.type)}
                    style={[styles.tile, later && styles.tileLater]}
                  >
                    <Text style={[styles.glyph, later && styles.later]}>{t.glyph}</Text>
                    <Text style={[styles.tileLabel, later && styles.later]}>{t.type === 'map' ? '지도' : BLOCK_LABEL[t.type]}</Text>
                    {later ? <Text style={styles.badge}>나중에</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  where: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    paddingHorizontal: space.screenX,
    marginTop: -space[5],
    marginBottom: space[6],
  },
  body: {
    paddingHorizontal: space.screenX,
    gap: space[7],
  },
  cat: {
    gap: space[3],
  },
  catName: {
    ...textStyle({ size: 'small', weight: 'semibold', color: color.ink.muted }),
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
  },
  tile: {
    width: '31.8%',
    alignItems: 'center',
    gap: 4,
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    paddingVertical: space[5],
  },
  tileLater: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  glyph: {
    ...textStyle({ size: 'title3', weight: 'regular', color: color.ink.secondary }),
  },
  tileLabel: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }),
  },
  later: {
    color: color.ink.placeholder,
  },
  badge: {
    ...textStyle({ size: 'caption', weight: 'medium', color: color.ink.muted }),
  },
});
