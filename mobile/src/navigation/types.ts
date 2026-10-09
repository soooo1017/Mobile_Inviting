export type RootStackParamList = {
  Splash: undefined;
  HomeGuest: undefined;
  MainTabs: undefined;
  Login: undefined;
  Signup: undefined;
  ResetRequest: undefined;
  ResetSent: { email: string };
  NewProjectType: undefined;
  NewProjectInfo: undefined;
  NewProjectThanks: undefined;
  ThemeSelect: undefined;
  EditorPlaceholder: { projectId: string; tab?: 'invite' | 'thanks' };
  ManagePlaceholder: { projectId: string };
};

export type MainTabParamList = {
  Home: undefined;
  ProjectList: undefined;
  My: undefined;
};
