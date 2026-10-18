import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { DragList } from './DragList';
import { blockLabel, blockSummary } from './format';
import type { Block } from './types';

type Props = {
  blocks: Block[];
  /** Card shown as selected when 순서 편집 was opened by long-pressing a block (or a block was just added here). */
  highlightId: string | null;
  onMove: (from: number, to: number) => void;
  onDuplicate: (block: Block) => void;
  onDelete: (block: Block, index: number) => void;
  onInsertAt: (index: number) => void;
};

/** 순서 편집: every block as a summary card. Tap = block menu, long press = drag, "+" between cards = add there. */
export function ReorderView({ blocks, highlightId, onMove, onDuplicate, onDelete, onInsertAt }: Props) {
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [scrollLocked, setScrollLocked] = useState(false);
  const menuBlock = menuFor !== null ? blocks[menuFor] : undefined;

  const close = () => setMenuFor(null);

  return (
    <>
      <Text style={styles.hint}>카드를 탭하면 메뉴, 꾹 누르면 위아래로 옮길 수 있어요</Text>
      <ScrollView contentContainerStyle={styles.list} scrollEnabled={!scrollLocked}>
        <DragList
          items={blocks}
          keyOf={(b) => b.id}
          onReorder={onMove}
          onDragChange={setScrollLocked}
          renderGap={(indexAfter) => (
            <View style={styles.gap}>
              <Pressable onPress={() => onInsertAt(indexAfter)} hitSlop={8} style={styles.plus} accessibilityLabel="이 자리에 블록 추가">
                <Text style={styles.plusMark}>+</Text>
              </Pressable>
            </View>
          )}
          renderItem={(block, index, { startDrag, releaseDrag, dragging }) => (
            <Pressable
              onPress={() => setMenuFor(index)}
              onLongPress={startDrag}
              onPressOut={releaseDrag}
              delayLongPress={300}
              style={[styles.card, (block.id === highlightId || dragging) && styles.cardOn]}
            >
              <Text style={styles.grip}>⠿</Text>
              <View style={styles.kind}>
                <Text style={styles.kindLabel}>{blockLabel(block)}</Text>
              </View>
              <Text style={styles.summary} numberOfLines={1}>
                {blockSummary(block)}
              </Text>
            </Pressable>
          )}
        />
      </ScrollView>

      <BottomSheet visible={menuBlock !== undefined} onClose={close} title={menuBlock ? `${blockLabel(menuBlock)} · ${blockSummary(menuBlock)}` : ''}>
        {menuBlock && menuFor !== null ? (
          <View style={styles.menu}>
            <MenuRow
              icon="⧉"
              label="복제"
              onPress={() => {
                onDuplicate(menuBlock);
                close();
              }}
            />
            <MenuRow
              icon="↑"
              label="위로 이동"
              disabled={menuFor === 0}
              onPress={() => {
                onMove(menuFor, menuFor - 1);
                close();
              }}
            />
            <MenuRow
              icon="↓"
              label="아래로 이동"
              disabled={menuFor === blocks.length - 1}
              onPress={() => {
                onMove(menuFor, menuFor + 1);
                close();
              }}
            />
            <MenuRow
              icon="✕"
              label="삭제"
              danger
              onPress={() => {
                onDelete(menuBlock, menuFor);
                close();
              }}
            />
          </View>
        ) : null}
      </BottomSheet>
    </>
  );
}

function MenuRow({ icon, label, onPress, disabled, danger }: { icon: string; label: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.menuRow, disabled && styles.menuOff]}>
      <Text style={[styles.menuIcon, danger && styles.danger]}>{icon}</Text>
      <Text style={[styles.menuLabel, danger && styles.danger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    paddingHorizontal: space.screenX,
    paddingBottom: space[5],
  },
  list: {
    paddingHorizontal: space.screenX,
    paddingBottom: 120,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    paddingHorizontal: space[5],
    paddingVertical: space[5],
  },
  cardOn: {
    borderColor: color.accent.base,
    backgroundColor: color.accent.tint,
  },
  grip: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.placeholder }),
  },
  kind: {
    backgroundColor: color.accent.tint,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  kindLabel: {
    ...textStyle({ size: 'caption', weight: 'semibold', color: color.accent.base }),
  },
  summary: {
    flex: 1,
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.primary }),
  },
  gap: {
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: color.line.strong,
    backgroundColor: color.bg.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusMark: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.secondary }),
    marginTop: -1,
  },
  menu: {
    marginHorizontal: space.screenX,
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingHorizontal: space[6],
    paddingVertical: space[6],
    borderBottomWidth: 1,
    borderBottomColor: color.line.soft,
  },
  menuOff: {
    opacity: 0.35,
  },
  menuIcon: {
    width: 18,
    textAlign: 'center',
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.secondary }),
  },
  menuLabel: {
    ...textStyle({ size: 'control', weight: 'medium', color: color.ink.primary }),
  },
  danger: {
    color: color.status.error,
  },
});
