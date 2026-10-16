import { useCallback, useEffect, useRef, type ReactNode, type RefObject } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const FOCUS_TOP_MARGIN = 16;

// Field positions come from onLayout on views that sit directly inside the
// form's first (top-aligned, unpadded) content view, so their y is also their
// offset inside the scroll content.
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
  scrollRef: RefObject<ScrollView | null>;
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function KeyboardAwareForm({ scrollRef, children, contentContainerStyle }: Props) {
  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.grow, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
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
