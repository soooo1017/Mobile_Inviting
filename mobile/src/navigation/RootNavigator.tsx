import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { SplashScreen } from '../screens/SplashScreen';
import { HomeGuestScreen } from '../screens/HomeGuestScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { SignupSentScreen } from '../screens/SignupSentScreen';
import { ResetRequestScreen } from '../screens/ResetRequestScreen';
import { ResetSentScreen } from '../screens/ResetSentScreen';
import { MainTabs } from './MainTabs';
import { NewProjectTypeScreen } from '../screens/newProject/NewProjectTypeScreen';
import { NewProjectInfoScreen } from '../screens/newProject/NewProjectInfoScreen';
import { NewProjectThanksScreen } from '../screens/newProject/NewProjectThanksScreen';
import { ThemeSelectScreen } from '../screens/newProject/ThemeSelectScreen';
import { EditorPlaceholderScreen } from '../screens/EditorPlaceholderScreen';
import { ManagePlaceholderScreen } from '../screens/ManagePlaceholderScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="HomeGuest" component={HomeGuestScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="SignupSent" component={SignupSentScreen} />
      <Stack.Screen name="ResetRequest" component={ResetRequestScreen} />
      <Stack.Screen name="ResetSent" component={ResetSentScreen} />
      <Stack.Screen name="NewProjectType" component={NewProjectTypeScreen} />
      <Stack.Screen name="NewProjectInfo" component={NewProjectInfoScreen} />
      <Stack.Screen name="NewProjectThanks" component={NewProjectThanksScreen} />
      <Stack.Screen name="ThemeSelect" component={ThemeSelectScreen} />
      <Stack.Screen name="EditorPlaceholder" component={EditorPlaceholderScreen} />
      <Stack.Screen name="ManagePlaceholder" component={ManagePlaceholderScreen} />
    </Stack.Navigator>
  );
}
