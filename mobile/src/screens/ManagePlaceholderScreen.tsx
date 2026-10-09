import { Text, View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useProjects } from '../state/ProjectsContext';
import { BackButton } from '../components/BackButton';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'ManagePlaceholder'>;

// E21 (관리: 응답·공유·설정) hasn't been designed yet — stub landing target.
export function ManagePlaceholderScreen({ navigation, route }: Props) {
  const { getProject } = useProjects();
  const project = getProject(route.params.projectId);

  return (
    <View style={styles.screen}>
      <BackButton onPress={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text style={styles.title}>관리 화면 준비 중</Text>
        <Text style={styles.desc}>
          {project ? `“${project.title}” ` : ''}
          응답 현황·공유·프로젝트 설정(E21)은 다음 핸드오프에서 제공됩니다.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  body: {
    flex: 1,
    paddingHorizontal: space.screenX,
    justifyContent: 'center',
    gap: space[8],
  },
  title: {
    ...textStyle({ size: 'title1', weight: 'semibold', color: color.ink.primary }),
  },
  desc: {
    ...textStyle({ size: 'body', weight: 'regular', color: color.ink.muted }),
    lineHeight: 12.5 * 1.6,
  },
});
