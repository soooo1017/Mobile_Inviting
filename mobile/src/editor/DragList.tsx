/* eslint-disable react-hooks/refs -- PanResponder callbacks only read refs inside gesture events, never during render; the rule can't tell them apart from render code. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, PanResponder, View, StyleSheet } from 'react-native';
import { color } from '../theme/tokens';

type Props<T> = {
  items: T[];
  keyOf: (item: T) => string;
  /** `startDrag` goes on the item's onLongPress and `releaseDrag` on its onPressOut: 꾹 눌러 끌기. */
  renderItem: (item: T, index: number, ctx: { startDrag: () => void; releaseDrag: () => void; dragging: boolean }) => ReactNode;
  /** Rendered between items (e.g. the 순서 편집 "+" buttons); hidden while dragging. */
  renderGap?: (indexAfter: number) => ReactNode;
  onReorder: (from: number, to: number) => void;
  /** Lets the parent ScrollView stop scrolling while an item is being dragged. */
  onDragChange?: (dragging: boolean) => void;
};

type Slot = { y: number; h: number };
type Drag = { from: number; to: number };

function targetFor(slots: Slot[], from: number, delta: number) {
  const center = slots[from].y + slots[from].h / 2 + delta;
  let to = from;
  for (let i = 0; i < slots.length; i++) {
    if (!slots[i]) continue;
    const mid = slots[i].y + slots[i].h / 2;
    if (i < from && center < mid) return i;
    if (i > from && center > mid) to = i;
  }
  return to;
}

/**
 * Vertical list where a long-pressed item lifts and follows the finger; the
 * spot it would land in is outlined with a dashed box and it drops there on
 * release. Built on PanResponder only, so it runs in Expo Go.
 */
export function DragList<T>({ items, keyOf, renderItem, renderGap, onReorder, onDragChange }: Props<T>) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [dy] = useState(() => new Animated.Value(0));

  // Gesture handlers run outside render, so they read the latest values through refs kept in sync here.
  const slotsRef = useRef<Slot[]>([]);
  const dragRef = useRef<Drag | null>(null);
  const granted = useRef(false);
  const callbacks = useRef({ onReorder, onDragChange });
  useEffect(() => {
    slotsRef.current = slots;
    callbacks.current = { onReorder, onDragChange };
  });

  const finish = () => {
    const d = dragRef.current;
    dragRef.current = null;
    granted.current = false;
    setDrag(null);
    dy.setValue(0);
    callbacks.current.onDragChange?.(false);
    if (d && d.from !== d.to) callbacks.current.onReorder(d.from, d.to);
  };

  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: () => dragRef.current !== null,
      onPanResponderGrant: () => {
        granted.current = true;
      },
      onPanResponderMove: (_e, g) => {
        const d = dragRef.current;
        if (!d || !slotsRef.current[d.from]) return;
        dy.setValue(g.dy);
        const to = targetFor(slotsRef.current, d.from, g.dy);
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

  const startDrag = (index: number) => {
    if (!slots[index]) return;
    dragRef.current = { from: index, to: index };
    setDrag({ from: index, to: index });
    dy.setValue(0);
    onDragChange?.(true);
  };

  // Long-press then let go without moving: the list never took over the touch, so end the drag here.
  const releaseDrag = () => {
    setTimeout(() => {
      if (dragRef.current && !granted.current) finish();
    }, 60);
  };

  const setSlot = (i: number, patch: Partial<Slot>) =>
    setSlots((prev) => {
      const cur = prev[i] ?? { y: 0, h: 0 };
      const next = { ...cur, ...patch };
      if (prev[i] && next.y === cur.y && next.h === cur.h) return prev;
      const copy = prev.slice(0, items.length);
      copy[i] = next;
      return copy;
    });

  const gapAfter = (i: number) => {
    const a = slots[i];
    const b = slots[i + 1] ?? slots[i - 1];
    if (!a || !b) return 0;
    return slots[i + 1] ? b.y - (a.y + a.h) : a.y - (b.y + b.h);
  };

  // Where the other items slide to make room.
  const shiftFor = (i: number) => {
    if (!drag || i === drag.from || !slots[drag.from]) return 0;
    const h = slots[drag.from].h + gapAfter(drag.from);
    if (drag.from < drag.to && i > drag.from && i <= drag.to) return -h;
    if (drag.from > drag.to && i >= drag.to && i < drag.from) return h;
    return 0;
  };

  let drop: { top: number; height: number } | null = null;
  if (drag && slots[drag.from] && slots[drag.to]) {
    const top = drag.to <= drag.from ? slots[drag.to].y : slots[drag.to].y + slots[drag.to].h - slots[drag.from].h;
    drop = { top, height: slots[drag.from].h };
  }

  return (
    <View {...responder.panHandlers}>
      {drop ? <View pointerEvents="none" style={[styles.drop, drop]} /> : null}
      {items.map((item, i) => {
        const dragging = drag?.from === i;
        return (
          <View key={keyOf(item)} onLayout={(e) => setSlot(i, { y: e.nativeEvent.layout.y })}>
            <Animated.View
              onLayout={(e) => setSlot(i, { h: e.nativeEvent.layout.height })}
              style={
                dragging
                  ? [styles.lifted, { transform: [{ translateY: dy }, { scale: 1.02 }] }]
                  : { transform: [{ translateY: shiftFor(i) }] }
              }
            >
              {renderItem(item, i, { startDrag: () => startDrag(i), releaseDrag, dragging })}
            </Animated.View>
            {renderGap && i < items.length - 1 ? <View style={drag ? styles.hidden : null}>{renderGap(i + 1)}</View> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  lifted: {
    zIndex: 10,
    elevation: 8,
    shadowColor: '#23212a',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  drop: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: color.accent.tintBorder,
    borderRadius: 10,
  },
  hidden: {
    opacity: 0,
  },
});
