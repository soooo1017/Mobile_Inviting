import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const FOCUS_TOP_MARGIN = 16;

// Field positions come from onLayout, so register views whose parent starts at
// the very top of the form's content (KeyboardAwareForm's children, or a view
// that is its first, unpadded child) — then their y is their scroll offset.
export function useKeyboardAwareForm() {
  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});
  const focusedKey = useRef<string | null>(null);
  const keyboardVisible = useRef(false);

  const scrollToField = useCallback((key: string) => {
    const y = positions.current[key];
    if (y === undefined) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - FOCUS_TOP_MARGIN), animated: true });
  }, []);

  useEffect(() => {
    // Scroll after the keyboard is up: before that, the view hasn't shrunk yet,
    // so the scroll range is too short and the offset would be clamped.
    const show = Keyboard.addListener('keyboardDidShow', () => {
      keyboardVisible.current = true;
      if (focusedKey.current) scrollToField(focusedKey.current);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardVisible.current = false;
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [scrollToField]);

  const fieldLayout = useCallback(
    (key: string) => (e: LayoutChangeEvent) => {
      positions.current[key] = e.nativeEvent.layout.y;
    },
    [],
  );

  const onFieldFocus = useCallback(
    (key: string) => {
      focusedKey.current = key;
      if (keyboardVisible.current) scrollToField(key);
    },
    [scrollToField],
  );

  return { scrollRef, fieldLayout, onFieldFocus };
}

type Props = {
  scrollRef?: RefObject<ScrollView | null>;
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Pinned below the scroll area; rides up with the keyboard instead of hiding behind it. */
  footer?: ReactNode;
};

export function KeyboardAwareForm({ scrollRef, children, contentContainerStyle, footer }: Props) {
  // KeyboardAvoidingView works out the keyboard overlap from its own frame,
  // which is relative to its parent, not the screen. Measuring where the form
  // actually sits on screen and passing that as the offset keeps the overlap
  // right even when the form starts below a title or tabs.
  const containerRef = useRef<View>(null);
  const [windowTop, setWindowTop] = useState(0);
  const measure = useCallback(() => {
    containerRef.current?.measureInWindow((_x, y) => setWindowTop(y));
  }, []);

  return (
    <View ref={containerRef} style={styles.fill} onLayout={measure}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={windowTop}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.grow}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          {/* Taps on anything that isn't itself a control (labels, padding, empty
              space) land here and close the keyboard; buttons and inputs still
              get their own taps on the first try thanks to persistTaps="handled". */}
          <Pressable style={[styles.grow, contentContainerStyle]} onPress={Keyboard.dismiss} accessible={false}>
            {children}
          </Pressable>
        </ScrollView>
        {footer}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  grow: {
    flexGrow: 1,
  },
});
