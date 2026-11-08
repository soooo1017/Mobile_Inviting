import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { BackButton } from '../../components/BackButton';
import { BGM_TRACKS, bgmTrackById } from '../../editor/bgm';
import { BgmSourceDetail, BgmSourceList } from '../../editor/BgmSources';
import { color, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';

type ListProps = NativeStackScreenProps<RootStackParamList, 'BgmSources'>;
type DetailProps = NativeStackScreenProps<RootStackParamList, 'BgmSource'>;

/** My Page › 약관 및 정책 › 음원 출처 · 라이선스 — 곡 이름 · 작곡가만 보이는 목록. */
export function BgmSourcesScreen({ navigation }: ListProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <BackButton onPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>음원 출처 · 라이선스</Text>
        <Text style={styles.meta}>{`배경음악 ${BGM_TRACKS.length}곡`}</Text>
        <View style={styles.body}>
          <BgmSourceList onOpen={(trackId) => navigation.navigate('BgmSource', { trackId })} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** 곡을 누르면 열리는 곡 상세 (라이선스 아이콘 · 작곡 · 연주 · 출처 · 초대장에 표시되는 문구). */
export function BgmSourceDetailScreen({ navigation, route }: DetailProps) {
  const track = bgmTrackById(route.params.trackId);
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <BackButton onPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>음원 정보</Text>
        <Text style={styles.meta}>음원 출처 · 라이선스</Text>
        <View style={styles.body}>{track ? <BgmSourceDetail track={track} /> : null}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  content: {
    paddingHorizontal: space.screenX,
    paddingBottom: space[10],
  },
  title: {
    ...textStyle({
      size: 'display',
      weight: 'semibold',
      lineHeight: 'heading',
      letterSpacing: 'heading',
      color: color.ink.primary,
    }),
    marginTop: space[9],
  },
  meta: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    marginTop: space[3],
  },
  body: {
    marginTop: space[7],
  },
});
