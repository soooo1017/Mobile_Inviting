import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModalSafeArea } from '../components/ModalSafeArea';
import { color, radius, size, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

/** Lets a drag list inside a sheet stop the sheet from scrolling while an item is being dragged. */
export const ScrollLockContext = createContext<(locked: boolean) => void>(() => {});

/** Deletes the block being edited. Set by the editor screen; shown as 블록 삭제하기 at the bottom of a block's main editor page. */
export const BlockDeleteContext = createContext<(() => void) | null>(null);

function DeleteBlockButton() {
  const onDelete = useContext(BlockDeleteContext);
  if (!onDelete) return null;
  return (
    <Pressable
      onPress={() => {
        Keyboard.dismiss();
        onDelete();
      }}
      style={({ pressed }) => [styles.delete, pressed && styles.deletePressed]}
      accessibilityRole="button"
    >
      <Text style={styles.deleteLabel}>블록 삭제하기</Text>
    </Pressable>
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
  children: ReactNode;
  /** Fraction of the screen height the sheet may take (the block above stays visible). */
  maxHeight?: number;
};

/**
 * Block edit sheet. It's part of the editor screen (not a modal) so the block
 * stays visible above it and every change shows up on it right away.
 */
export function EditorSheet({ title, onDone, onBack, doneLabel = '완료', children, maxHeight = 0.62 }: SheetProps) {
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
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              onDone();
            }}
            hitSlop={10}
          >
            <Text style={styles.done}>{doneLabel}</Text>
          </Pressable>
        </View>
        <ScrollView
          ref={scrollRef}
          style={styles.shrink}
          scrollEnabled={!locked}
          contentContainerStyle={[styles.body, { paddingBottom: Math.max(insets.bottom, space[8]) + space[4] }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <View ref={contentRef} collapsable={false}>
            <Pressable onPress={Keyboard.dismiss} accessible={false} style={styles.bodyInner}>
              <ScrollLockContext.Provider value={setLocked}>{children}</ScrollLockContext.Provider>
              {onBack ? null : <DeleteBlockButton />}
            </Pressable>
          </View>
        </ScrollView>
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
  closeLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Full-screen editor for blocks with a lot to set (갤러리, 참석 응답). */
export function FullScreenEditor({ visible, title, onClose, onDone, doneLabel = '완료', closeLabel = '✕', children, footer }: FullProps) {
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
          {onDone ? (
            <Pressable onPress={onDone} hitSlop={10}>
              <Text style={styles.done}>{doneLabel}</Text>
            </Pressable>
          ) : (
            <View style={styles.headSpacer} />
          )}
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
                <DeleteBlockButton />
              </Pressable>
            </View>
          </ScrollView>
          {footer}
        </KeyboardAvoidingView>
      </ModalSafeArea>
    </Modal>
  );
}

const styles = StyleSheet.create({
  delete: {
    marginTop: space[4],
    backgroundColor: color.status.error,
    borderRadius: radius.button,
    paddingVertical: size.buttonPaddingY,
    alignItems: 'center',
  },
  deletePressed: {
    opacity: 0.85,
  },
  deleteLabel: {
    ...textStyle({ size: 'button2', weight: 'semibold', color: '#ffffff' }),
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
    paddingBottom: space[10] * 2,
  },
});
