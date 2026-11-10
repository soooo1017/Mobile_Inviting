import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { BLOCK_LABEL, type BlockType } from './types';

type Tile = { type: BlockType; glyph: string };

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
  /** Only these kinds are offered (안내 팝업은 짧은 것만). Default: all. */
  types?: BlockType[];
  /** '제안하기'를 누르면 — 문의의 '아이디어 · 기능 제안'으로 넘어가요. 없으면 안내 줄을 숨겨요. */
  onSuggest?: () => void;
  /** 더 넣을 수 없는 종류와 그 이유 (예: 갤러리는 최대 3개) — 눌러도 추가되지 않고 이유를 보여줘요. */
  blocked?: Partial<Record<BlockType, string>>;
};

/** Same sheet whether opened from the editor's bottom button or a "+" in 순서 편집. */
export function AddBlockSheet({ visible, where, onPick, onClose, types, onSuggest, blocked }: Props) {
  const [notice, setNotice] = useState<string | null>(null);
  // 시트를 닫거나 항목을 고르면 안내를 지워요 (다음에 열 때 이전 안내가 남지 않게).
  const finish = (fn: () => void) => () => {
    setNotice(null);
    fn();
  };
  const categories = CATEGORIES.map((cat) => ({ ...cat, tiles: cat.tiles.filter((t) => !types || types.includes(t.type)) })).filter((cat) => cat.tiles.length);
  return (
    <BottomSheet visible={visible} onClose={finish(onClose)} title="추가하기">
      <Text style={styles.where}>{where}</Text>
      <View style={styles.body}>
        {categories.map((cat) => (
          <View key={cat.name} style={styles.cat}>
            <Text style={styles.catName}>{cat.name}</Text>
            <View style={styles.tiles}>
              {cat.tiles.map((t) => (
                <Pressable
                  key={t.type}
                  onPress={() => {
                    const why = blocked?.[t.type];
                    if (why) setNotice(why);
                    else finish(() => onPick(t.type))();
                  }}
                  style={[styles.tile, blocked?.[t.type] ? styles.tileOff : null]}
                  accessibilityState={{ disabled: Boolean(blocked?.[t.type]) }}
                >
                  <Text style={styles.glyph}>{t.glyph}</Text>
                  <Text style={styles.tileLabel}>{BLOCK_LABEL[t.type]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {onSuggest ? (
        <Text style={styles.suggest}>
          {'원하는 항목이 없나요? '}
          <Text onPress={finish(onSuggest)} style={styles.suggestLink} accessibilityRole="link">
            제안하기
          </Text>
        </Text>
      ) : null}
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
  glyph: {
    ...textStyle({ size: 'title3', weight: 'regular', color: color.ink.secondary }),
  },
  tileOff: {
    opacity: 0.4,
  },
  notice: {
    ...textStyle({ size: 'small', weight: 'medium', color: color.status.error }),
    textAlign: 'center',
    marginTop: space[6],
  },
  suggest: {
    ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.muted }),
    textAlign: 'center',
    marginTop: space[8],
    paddingBottom: space[3],
  },
  suggestLink: {
    ...textStyle({ size: 'caption', weight: 'semibold', color: color.accent.base }),
  },
  tileLabel: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }),
  },
});
