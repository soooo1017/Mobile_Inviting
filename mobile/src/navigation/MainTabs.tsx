import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { TabBar } from './TabBar';
import { HomeScreen } from '../screens/HomeScreen';
import { ProjectListScreen } from '../screens/projectList/ProjectListScreen';
import { MyPlaceholderScreen } from '../screens/MyPlaceholderScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="ProjectList" component={ProjectListScreen} />
      <Tab.Screen name="My" component={MyPlaceholderScreen} />
    </Tab.Navigator>
  );
}
