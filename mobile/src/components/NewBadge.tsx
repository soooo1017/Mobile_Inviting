import { Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { textStyle } from '../theme/typography';
import { getUnread } from '../utils/unread';
import type { Project } from '../types/project';

/** 새 소식이 있을 때 카드에 붙는 빨간 종 + 개수. 새 소식이 없으면 아무것도 안 그려요. */
export function NewBadge({ project, style }: { project: Project; style?: StyleProp<ViewStyle> }) {
  const { total } = getUnread(project);
  if (total === 0) return null;
  return (
    <View style={[styles.badge, style]} accessibilityLabel={`새 소식 ${total}개`}>
      <Svg width={13} height={13} viewBox="0 0 16 16" fill="#ffffff">
        <Path d="M8 1.6a4.2 4.2 0 0 0-4.2 4.2v2.5L2.5 10.9a.7.7 0 0 0 .6 1h9.8a.7.7 0 0 0 .6-1l-1.3-2.6V5.8A4.2 4.2 0 0 0 8 1.6Zm-1.6 11.2a1.7 1.7 0 0 0 3.2 0H6.4Z" />
      </Svg>
      <Text style={styles.count}>{total > 9 ? '9+' : total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: '#d64545',
    borderRadius: 999,
    paddingLeft: 6,
    paddingRight: 8,
    paddingVertical: 3,
  },
  count: {
    ...textStyle({ size: 'caption', weight: 'semibold', color: '#ffffff' }),
  },
});
