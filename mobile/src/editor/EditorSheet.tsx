import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModalSafeArea } from '../components/ModalSafeArea';
import { color, radius, size, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

/** Lets a drag list inside a sheet stop the sheet from scrolling while an item is being dragged. */
export const ScrollLockContext = createContext<(locked: boolean) => void>(() => {});

/** Deletes the block being edited. Set by the editor screen; shown as 삭제하기 at the bottom of a block's main editor page. */
export const BlockDeleteContext = createContext<(() => void) | null>(null);

/**
 * 블록 편집 창 맨 아래 — [삭제하기] [완료]를 나란히. 완료를 누르려다 삭제를 누르는 일이 없게
 * 삭제하기는 테두리 버튼, 완료는 진한 버튼이에요. 삭제 기능이 없는 창은 완료 하나만 넓게.
 * `guard`가 문구를 돌려주면(예: 사진을 안 넣음) 닫지 않고 그 안내를 보여줘요.
 */
function SheetFooter({ onDone, doneLabel, guard, bottomInset }: { onDone: () => void; doneLabel: string; guard?: () => string | null; bottomInset: number }) {
  const onDelete = useContext(BlockDeleteContext);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(t);
  }, [notice]);
  return (
    <View style={[styles.footer, { paddingBottom: Math.max(bottomInset, space[6]) }]}>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <View style={styles.footerRow}>
        {onDelete ? (
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              onDelete();
            }}
            style={({ pressed }) => [styles.footerBtn, styles.deleteBtn, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.deleteLabel}>삭제하기</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            const msg = guard?.() ?? null;
            if (msg) setNotice(msg);
            else onDone();
          }}
          style={({ pressed }) => [styles.footerBtn, styles.doneBtn, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.doneBtnLabel}>{doneLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** When the keyboard opens, scroll the sheet so the field being typed in sits just below the sheet's top. */
function useScrollToFocusedInput() {
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      const input = TextInput.State.currentlyFocusedInput();
      const content = contentRef.current;
      if (!input || !content) return;
      input.measureLayout(
        content,
        (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 40), animated: true }),
        () => {},
      );
    });
    return () => sub.remove();
  }, []);
  return { scrollRef, contentRef };
}

type SheetProps = {
  title: string;
  onDone: () => void;
  /** Sub-page header ("‹ 글꼴") instead of the plain title. */
  onBack?: () => void;
  doneLabel?: string;
  /** 완료를 눌렀을 때 문구를 돌려주면 닫지 않고 안내해요 (예: 사진을 안 넣은 이미지). */
  doneGuard?: () => string | null;
  children: ReactNode;
  /** Fraction of the screen height the sheet may take (the block above stays visible). */
  maxHeight?: number;
};

/**
 * Block edit sheet. It's part of the editor screen (not a modal) so the block
 * stays visible above it and every change shows up on it right away.
 */
export function EditorSheet({ title, onDone, onBack, doneLabel = '완료', doneGuard, children, maxHeight = 0.62 }: SheetProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [locked, setLocked] = useState(false);
  const { scrollRef, contentRef } = useScrollToFocusedInput();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.anchor} pointerEvents="box-none">
      <View style={[styles.sheet, { maxHeight: height * maxHeight }]}>
        <View style={styles.grabber} />
        <View style={styles.head}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={10} style={styles.backWrap}>
              <Text style={styles.back}>‹</Text>
              <Text style={styles.title}>{title}</Text>
            </Pressable>
          ) : (
            <Text style={styles.title}>{title}</Text>
          )}
          {onBack ? (
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                onDone();
              }}
              hitSlop={10}
            >
              <Text style={styles.done}>{doneLabel}</Text>
            </Pressable>
          ) : null}
        </View>
        <ScrollView
          ref={scrollRef}
          style={styles.shrink}
          scrollEnabled={!locked}
          contentContainerStyle={[styles.body, { paddingBottom: space[7] }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <View ref={contentRef} collapsable={false}>
            <Pressable onPress={Keyboard.dismiss} accessible={false} style={styles.bodyInner}>
              <ScrollLockContext.Provider value={setLocked}>{children}</ScrollLockContext.Provider>
            </Pressable>
          </View>
        </ScrollView>
        {onBack ? <View style={{ height: Math.max(insets.bottom, space[6]) }} /> : <SheetFooter onDone={onDone} doneLabel={doneLabel} guard={doneGuard} bottomInset={insets.bottom} />}
      </View>
    </KeyboardAvoidingView>
  );
}

type FullProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onDone?: () => void;
  doneLabel?: string;
  doneGuard?: () => string | null;
  closeLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Full-screen editor for blocks with a lot to set (갤러리, 참석 응답). */
export function FullScreenEditor({ visible, title, onClose, onDone, doneLabel = '완료', doneGuard, closeLabel = '✕', children, footer }: FullProps) {
  const insets = useSafeAreaInsets();
  const [locked, setLocked] = useState(false);
  const { scrollRef, contentRef } = useScrollToFocusedInput();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <ModalSafeArea style={styles.full}>
        <View style={styles.fullHead}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.fullClose}>{closeLabel}</Text>
          </Pressable>
          <Text style={styles.fullTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.headSpacer} />
        </View>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            scrollEnabled={!locked}
            contentContainerStyle={styles.fullBody}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            <View ref={contentRef} collapsable={false}>
              <Pressable onPress={Keyboard.dismiss} accessible={false} style={styles.bodyInner}>
                <ScrollLockContext.Provider value={setLocked}>{children}</ScrollLockContext.Provider>
              </Pressable>
            </View>
          </ScrollView>
          {footer ?? (onDone ? <SheetFooter onDone={onDone} doneLabel={doneLabel} guard={doneGuard} bottomInset={insets.bottom} /> : null)}
        </KeyboardAvoidingView>
      </ModalSafeArea>
    </Modal>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: space.screenX,
    paddingTop: space[5],
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
    backgroundColor: color.bg.sheet,
    gap: space[4],
  },
  footerRow: {
    flexDirection: 'row',
    gap: space[4],
  },
  footerBtn: {
    flex: 1,
    borderRadius: radius.button,
    paddingVertical: size.buttonPaddingY,
    alignItems: 'center',
  },
  deleteBtn: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.status.errorBorder,
  },
  deleteLabel: {
    ...textStyle({ size: 'button2', weight: 'semibold', color: color.status.error }),
  },
  doneBtn: {
    backgroundColor: color.ink.primary,
  },
  doneBtnLabel: {
    ...textStyle({ size: 'button2', weight: 'semibold', color: color.ink.onPrimary }),
  },
  pressed: {
    opacity: 0.85,
  },
  notice: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.status.error }),
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
  anchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'flex-end',
  },
  shrink: {
    flexShrink: 1,
  },
  sheet: {
    // Shrinks to the space left above the keyboard instead of running off the top.
    flexShrink: 1,
    backgroundColor: color.bg.sheet,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    shadowColor: '#23212a',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.line.chip,
    marginTop: space[3],
    marginBottom: space[4],
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
    paddingBottom: space[5],
  },
  backWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  back: {
    ...textStyle({ size: 'title1', weight: 'regular', color: color.ink.secondary }),
    marginTop: -3,
  },
  title: {
    ...textStyle({ size: 'sheetTitle', weight: 'semibold', color: color.ink.primary }),
  },
  done: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.accent.base }),
  },
  body: {
    paddingHorizontal: space.screenX,
  },
  bodyInner: {
    gap: space[8],
  },
  full: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  fullHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingHorizontal: space.screenX,
    paddingVertical: space[5],
    borderBottomWidth: 1,
    borderBottomColor: color.line.default,
  },
  fullClose: {
    ...textStyle({ size: 'title2', weight: 'regular', color: color.ink.primary }),
  },
  fullTitle: {
    flex: 1,
    ...textStyle({ size: 'sheetTitle', weight: 'semibold', color: color.ink.primary }),
  },
  headSpacer: {
    width: 30,
  },
  fullBody: {
    padding: space.screenX,
    paddingBottom: space[9],
  },
});
