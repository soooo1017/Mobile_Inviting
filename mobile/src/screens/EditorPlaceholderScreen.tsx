import { Text, View, StyleSheet } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useProjects } from '../state/ProjectsContext';
import { BackButton } from '../components/BackButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'EditorPlaceholder'>;

// B9 (블록 에디터) hasn't been designed yet — this stub just confirms the
// navigation target exists so the B6/B7 flows have somewhere real to land.
export function EditorPlaceholderScreen({ navigation, route }: Props) {
  const { getProject } = useProjects();
  const project = getProject(route.params.projectId);

  return (
    <View style={styles.screen}>
      <BackButton onPress={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text style={styles.title}>에디터 준비 중</Text>
        <Text style={styles.desc}>
          {project ? `“${project.title}” ` : ''}
          블록 에디터(B9)는 다음 핸드오프에서 제공됩니다.
          {route.params.tab === 'thanks' ? '\n(감사 페이지 탭으로 진입)' : ''}
        </Text>
        <PrimaryButton
          label="내 초대장으로"
          onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }))}
        />
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
