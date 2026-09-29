import { ActivityIndicator, Pressable, Text, StyleSheet } from 'react-native';
import { color, radius, size } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function PrimaryButton({ label, onPress, disabled, loading }: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color.ink.onPrimary} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    backgroundColor: color.ink.primary,
    borderRadius: radius.button,
    paddingVertical: size.buttonPaddingY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...textStyle({ size: 'control', weight: 'semibold', letterSpacing: 'button', color: color.ink.onPrimary }),
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
});
