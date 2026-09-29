import { Pressable, Text } from 'react-native';
import { color as colors, type FontSizeKey, type FontWeightKey } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = {
  children: string;
  onPress: () => void;
  size?: FontSizeKey;
  weight?: FontWeightKey;
  color?: string;
  underline?: boolean;
};

export function TextLink({
  children,
  onPress,
  size = 'label',
  weight = 'regular',
  color = colors.ink.muted,
  underline = false,
}: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      {({ pressed }) => (
        <Text
          style={[
            textStyle({ size, weight, color }),
            underline && { textDecorationLine: 'underline' },
            pressed && { opacity: 0.7 },
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}
