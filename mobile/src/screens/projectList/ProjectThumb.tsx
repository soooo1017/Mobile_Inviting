import { Image, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LEGACY_THEMES, type Project } from '../../types/project';
import { useCoverPhoto } from '../../state/InvitationsContext';

type Props = {
  project: Pick<Project, 'id' | 'colors' | 'themeId'>;
  style?: ViewStyle;
};

/** 카드 사진: 초대장의 대표 사진. 사진이 없으면 배경 → 포인트 색(또는 예전 고정 테마의 두 색) 그라데이션. */
export function ProjectThumb({ project, style }: Props) {
  const cover = useCoverPhoto(project.id);
  if (cover) return <Image source={{ uri: cover.uri }} style={style as StyleProp<ImageStyle>} resizeMode="cover" />;
  const colors: [string, string] = project.colors
    ? [project.colors.bg, project.colors.accent]
    : (LEGACY_THEMES.find((t) => t.id === project.themeId) ?? LEGACY_THEMES[0]).colors;
  return <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style} />;
}
