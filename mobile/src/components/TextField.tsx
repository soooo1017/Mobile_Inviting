import { useState } from 'react';
import { TextInput, View, StyleSheet, type TextInputProps } from 'react-native';
import { color, radius, size } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = TextInputProps & {
  error?: boolean;
  rightElement?: React.ReactNode;
};

export function TextField({ error, rightElement, style, onFocus, onBlur, ...inputProps }: Props) {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? color.status.error : focused ? color.line.focus : color.line.default;

  return (
    <View style={[styles.wrap, { borderColor }]}>
      <TextInput
        {...inputProps}
        style={[styles.input, style]}
        placeholderTextColor={color.ink.placeholder}
        selectionColor={color.accent.base}
        cursorColor={color.accent.base}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
      />
      {rightElement}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: size.controlPadding,
    paddingVertical: size.controlPadding,
  },
  input: {
    flex: 1,
    padding: 0,
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.primary }),
  },
});
