import { LinearGradient } from 'expo-linear-gradient';
import type { ViewStyle } from 'react-native';
import { LEGACY_THEMES, type Project } from '../../types/project';

type Props = {
  project: Pick<Project, 'colors' | 'themeId'>;
  style?: ViewStyle;
};

/** Card thumbnail: the invitation's 배경 → 포인트 색 (or its old fixed theme's two colors). */
export function ProjectThumb({ project, style }: Props) {
  const colors: [string, string] = project.colors
    ? [project.colors.bg, project.colors.accent]
    : (LEGACY_THEMES.find((t) => t.id === project.themeId) ?? LEGACY_THEMES[0]).colors;
  return <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style} />;
}
