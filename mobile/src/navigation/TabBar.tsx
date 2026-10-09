import { Pressable, Text, View, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { color } from '../theme/tokens';
import { textStyle } from '../theme/typography';

const LABEL: Record<string, string> = {
  Home: '홈',
  ProjectList: '내 초대장',
  My: '마이',
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const isMy = route.name === 'My';
        const labelColor = focused ? color.accent.base : isMy ? color.ink.inactive : color.ink.primary;

        return (
          <Pressable
            key={route.key}
            style={styles.item}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          >
            <Text style={[styles.label, { color: labelColor }, focused && styles.labelFocused]}>
              {LABEL[route.name] ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: color.bg.tabbar,
    borderTopWidth: 1,
    borderTopColor: color.line.default,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },
  label: {
    ...textStyle({ size: 'small', weight: 'medium' }),
  },
  labelFocused: {
    fontFamily: 'Pretendard-SemiBold',
  },
});
