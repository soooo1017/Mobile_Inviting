import { Platform, Pressable, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { HomeTabIcon, PlusIcon, ProfileTabIcon } from '../components/icons/TabIcons';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

const LABEL: Record<string, string> = {
  Home: '홈',
  My: '마이',
};

const ICON: Record<string, typeof HomeTabIcon> = {
  Home: HomeTabIcon,
  My: ProfileTabIcon,
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const renderItem = (index: number) => {
    const route = state.routes[index];
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
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space[5]) }]}>
      {renderItem(0)}
      <View style={styles.addSlot}>
        <Pressable style={styles.addButton} onPress={() => rootNavigation.navigate('NewProjectType')}>
          <PlusIcon color={color.ink.onPrimary} />
        </Pressable>
      </View>
      {renderItem(1)}
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
  addSlot: {
    width: 68,
    alignItems: 'center',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radius.circle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.accent.base,
    transform: [{ translateY: -16 }],
    ...Platform.select({
      ios: {
        shadowColor: color.ink.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
