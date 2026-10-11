import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { TabBar } from './TabBar';
import { ProjectListScreen } from '../screens/projectList/ProjectListScreen';
import { MyPageScreen } from '../screens/myPage/MyPageScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Home" component={ProjectListScreen} />
      <Tab.Screen name="My" component={MyPageScreen} />
    </Tab.Navigator>
  );
}
