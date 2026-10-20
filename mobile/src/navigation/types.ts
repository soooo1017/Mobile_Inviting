export type RootStackParamList = {
  Splash: undefined;
  HomeGuest: undefined;
  MainTabs: undefined;
  Login: undefined;
  Signup: undefined;
  SignupSent: { email: string };
  ResetRequest: undefined;
  ResetSent: { email: string };
  NewProjectType: undefined;
  NewProjectInfo: undefined;
  NewProjectThanks: undefined;
  ThemeSelect: undefined;
  Editor: { projectId: string; tab?: 'invite' | 'thanks' };
  Manage: { projectId: string };
  ManageRsvp: { projectId: string };
  ManageGuestbook: { projectId: string };
  ManageStats: { projectId: string };
  ProjectSettings: { projectId: string };
  NicknameEdit: undefined;
  PasswordChange: undefined;
  NotificationSettings: undefined;
  SocialAccounts: undefined;
  AccountDeletion: undefined;
  Inquiry: { tab?: 'form' | 'history' };
  Terms: undefined;
  PrivacyPolicy: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  My: undefined;
};
