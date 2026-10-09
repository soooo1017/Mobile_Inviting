import { LinearGradient } from 'expo-linear-gradient';
import type { ViewStyle } from 'react-native';
import { THEMES } from '../../types/project';

type Props = {
  themeId: string;
  style?: ViewStyle;
};

export function ProjectThumb({ themeId, style }: Props) {
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  return (
    <LinearGradient
      colors={theme.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={style}
    />
  );
}
