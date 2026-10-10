import { useEffect, useState } from 'react';
import { Animated, Pressable, Text, View, StyleSheet } from 'react-native';
import { color, motion, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = {
  visible: boolean;
  message: string;
  onHide: () => void;
  tone?: 'error' | 'success';
  actionLabel?: string;
  onAction?: () => void;
};

export function Toast({ visible, message, onHide, tone = 'error', actionLabel, onAction }: Props) {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;
    Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }).start(onHide);
    }, motion.toastDuration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const bg = tone === 'error' ? color.status.error : color.status.success;

  return (
    <Animated.View
      style={[styles.wrap, { opacity, backgroundColor: bg }]}
      pointerEvents={actionLabel ? 'box-none' : 'none'}
    >
      <View style={styles.left}>
        <View style={styles.icon}>
          <Text style={styles.iconMark}>✓</Text>
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: space.screenX,
    right: space.screenX,
    bottom: space[9],
    borderRadius: radius.button,
    paddingVertical: space[5],
    paddingHorizontal: space[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[4],
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    flexShrink: 1,
  },
  action: {
    ...textStyle({ size: 'label', weight: 'semibold', color: '#ffffff' }),
    textDecorationLine: 'underline',
  },
  icon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMark: {
    color: color.status.error,
    fontSize: 10,
    fontWeight: '700',
  },
  message: {
    ...textStyle({ size: 'label', weight: 'medium', color: '#ffffff' }),
  },
});
