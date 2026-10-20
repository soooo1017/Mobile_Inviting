import type { RefObject } from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { textStyle } from '../../theme/typography';
import { POPUP_SIZE, type Block } from '../types';
import { Canvas } from './Canvas';
import { useCanvas } from './CanvasContext';

type FrameProps = {
  blocks: Block[];
  selectedId?: string | null;
  onPressBlock?: (block: Block) => void;
  onLongPressBlock?: (block: Block) => void;
  onBlockLayout?: (id: string, y: number, height: number) => void;
  /** Lets the editor scroll the tapped block into the part of the popup the sheet leaves visible. */
  scrollRef?: RefObject<ScrollView | null>;
  /** 편집: the empty popup asks for the first item. */
  onAdd?: () => void;
  /** 미리보기 · 게스트: the bottom row works. */
  dontShow?: boolean;
  onToggleDontShow?: () => void;
  onClose?: () => void;
};

/**
 * 안내 팝업 (고정 300 × 420). 위쪽 내용 영역은 넘치면 안에서 스크롤되고, 아랫줄
 * (☐ 오늘 하루 보지 않기 · [닫기])은 항상 같은 자리에 있어요.
 */
export function PopupFrame({ blocks, selectedId, onPressBlock, onLongPressBlock, onBlockLayout, scrollRef, onAdd, dontShow = false, onToggleDontShow, onClose }: FrameProps) {
  const { theme, mode } = useCanvas();
  const editing = mode === 'edit';
  return (
    <View style={[styles.frame, { backgroundColor: theme.paper }]}>
      <ScrollView ref={scrollRef} style={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {blocks.length ? (
          <Canvas
            variant="popup"
            blocks={blocks}
            selectedId={selectedId}
            onPressBlock={onPressBlock}
            onLongPressBlock={onLongPressBlock}
            onBlockLayout={onBlockLayout}
          />
        ) : (
          <Pressable onPress={onAdd} disabled={!onAdd} style={[styles.empty, { borderColor: theme.rule }]}>
            <Text style={[styles.plus, { color: theme.accentInk }]}>＋</Text>
            <Text style={[styles.emptyText, { color: theme.inkSoft }]}>{'여기에 안내를 채워 보세요'}</Text>
          </Pressable>
        )}
      </ScrollView>
      <View style={[styles.bar, { borderTopColor: theme.rule }]} pointerEvents={editing ? 'none' : 'auto'}>
        <Pressable onPress={onToggleDontShow} hitSlop={8} style={styles.check} accessibilityRole="checkbox" accessibilityState={{ checked: dontShow }}>
          <View style={[styles.box, { borderColor: theme.accentInk }, dontShow && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
            {dontShow ? <Text style={[styles.mark, { color: theme.onAccent }]}>✓</Text> : null}
          </View>
          <Text style={[styles.checkLabel, { color: theme.inkSoft }]}>오늘 하루 보지 않기</Text>
        </Pressable>
        <Pressable onPress={onClose} style={[styles.close, { backgroundColor: theme.accent }]} accessibilityRole="button">
          <Text style={[styles.closeLabel, { color: theme.onAccent }]}>닫기</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * 게스트가 초대장을 열었을 때 — 초대장 위에 어둡게 덮고 팝업이 가운데에 떠요.
 * [닫기]와 어두운 바깥은 같은 규칙: 닫히고, ☐ 오늘 하루 보지 않기가 체크돼 있으면 그날은 다시 안 떠요.
 */
export function GuestPopup({ blocks, onClose }: { blocks: Block[]; onClose: (dontShowToday: boolean) => void }) {
  const [dontShow, setDontShow] = useState(false);
  const close = () => onClose(dontShow);
  return (
    <View style={styles.overlay}>
      <Pressable style={styles.dim} onPress={close} accessibilityLabel="안내 팝업 닫기" />
      <View style={styles.center} pointerEvents="box-none">
        <PopupFrame blocks={blocks} dontShow={dontShow} onToggleDontShow={() => setDontShow((v) => !v)} onClose={close} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: POPUP_SIZE.width,
    height: POPUP_SIZE.height,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  content: {
    height: POPUP_SIZE.height - POPUP_SIZE.bar,
  },
  bar: {
    height: POPUP_SIZE.bar,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    fontSize: 11,
    fontFamily: 'Pretendard-SemiBold',
  },
  checkLabel: {
    ...textStyle({ size: 'small', weight: 'regular' }),
  },
  close: {
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 9,
  },
  closeLabel: {
    ...textStyle({ size: 'label', weight: 'semibold' }),
  },
  empty: {
    margin: 20,
    height: POPUP_SIZE.height - POPUP_SIZE.bar - 40,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  plus: {
    fontSize: 28,
  },
  emptyText: {
    ...textStyle({ size: 'label', weight: 'regular' }),
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  dim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,18,24,0.55)',
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
