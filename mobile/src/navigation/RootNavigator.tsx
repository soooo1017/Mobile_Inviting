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
import { EditorScreen } from '../screens/editor/EditorScreen';
import { ManagePlaceholderScreen } from '../screens/ManagePlaceholderScreen';
import { NicknameEditScreen } from '../screens/myPage/NicknameEditScreen';
import { PasswordChangeScreen } from '../screens/myPage/PasswordChangeScreen';
import { NotificationSettingsScreen } from '../screens/myPage/NotificationSettingsScreen';
import { SocialAccountsScreen } from '../screens/myPage/SocialAccountsScreen';
import { AccountDeletionScreen } from '../screens/myPage/AccountDeletionScreen';
import { InquiryScreen } from '../screens/myPage/InquiryScreen';
import { TermsScreen } from '../screens/myPage/TermsScreen';
import { PrivacyPolicyScreen } from '../screens/myPage/PrivacyPolicyScreen';

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
      <Stack.Screen name="Editor" component={EditorScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="ManagePlaceholder" component={ManagePlaceholderScreen} />
      <Stack.Screen name="NicknameEdit" component={NicknameEditScreen} />
      <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="SocialAccounts" component={SocialAccountsScreen} />
      <Stack.Screen name="AccountDeletion" component={AccountDeletionScreen} />
      <Stack.Screen name="Inquiry" component={InquiryScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
}
