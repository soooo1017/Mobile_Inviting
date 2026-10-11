import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

export function MyPlaceholderScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>마이</Text>
      <Text style={styles.body}>계정 설정, 알림, 포인트 내역은 다음 핸드오프에서 제공됩니다.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.screenX,
    gap: space[4],
  },
  title: {
    ...textStyle({ size: 'title1', weight: 'semibold', color: color.ink.primary }),
  },
  body: {
    ...textStyle({ size: 'body', weight: 'regular', color: color.ink.muted }),
    textAlign: 'center',
  },
});
