import { Platform, Pressable, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { HomeTabIcon, InviteTabIcon, ProfileTabIcon } from '../components/icons/TabIcons';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

const LABEL: Record<string, string> = {
  Home: '홈',
  ProjectList: '내 초대장',
  My: '마이',
};

const ICON: Record<string, typeof HomeTabIcon> = {
  Home: HomeTabIcon,
  ProjectList: InviteTabIcon,
  My: ProfileTabIcon,
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space[5]) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tint = focused ? color.accent.base : color.ink.inactive;
        const Icon = ICON[route.name] ?? HomeTabIcon;

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
            <Icon color={tint} active={focused} />
            <Text style={[styles.label, { color: tint }, focused && styles.labelFocused]}>
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
    paddingTop: space[6],
    ...Platform.select({
      ios: {
        shadowColor: color.ink.primary,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: space[2],
    paddingVertical: space[2],
  },
  label: {
    ...textStyle({ size: 'small', weight: 'medium' }),
  },
  labelFocused: {
    fontFamily: 'Pretendard-SemiBold',
  },
});
