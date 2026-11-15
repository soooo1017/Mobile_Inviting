import { useCallback, useContext, useEffect, useRef } from 'react';
import { BackHandler, Platform, StyleSheet, ToastAndroid, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CommonActions, NavigationContainer, NavigationContainerRefContext } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreenModule from 'expo-splash-screen';
import { AuthProvider, useAuth } from './src/state/AuthContext';
import { ProjectsProvider } from './src/state/ProjectsContext';
import { NewProjectDraftProvider } from './src/state/NewProjectDraftContext';
import { InvitationsProvider } from './src/state/InvitationsContext';
import { SyncProvider } from './src/sync/SyncProvider';
import { InvitationFontsProvider } from './src/editor/fonts';
import { RootNavigator } from './src/navigation/RootNavigator';
import { color } from './src/theme/tokens';

SplashScreenModule.preventAutoHideAsync().catch(() => {});

/**
 * 안드로이드 뒤로가기 마지막 안전장치. 화면 안에서 처리할 게 없고 더 이전 화면도 없을 때만 불려요
 * (시트 · 창 닫기는 각 화면이, 이전 화면으로 가기는 내비게이션이 먼저 해요).
 * · 목록 · 시작 화면이 아닌데 이전 화면이 없으면(예: 초대장을 만든 직후) 앱을 끄지 않고 목록(또는 시작 화면)으로 가요.
 * · 목록 · 시작 화면에서는 두 번 연달아 눌러야 앱이 꺼져요(실수로 꺼지지 않게).
 */
function AndroidBackFallback() {
  const nav = useContext(NavigationContainerRefContext);
  const { auth } = useAuth();
  const loggedIn = Boolean(auth.user);
  const lastBack = useRef(0);
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const state = nav?.getRootState();
      const name = state?.routes[state.index ?? 0]?.name;
      if (!nav || !name) return false;
      if (name !== 'MainTabs' && name !== 'HomeGuest' && name !== 'Splash') {
        nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: loggedIn ? 'MainTabs' : 'HomeGuest' }] }));
        return true;
      }
      const now = Date.now();
      if (now - lastBack.current < 2000) return false;
      lastBack.current = now;
      ToastAndroid.show('한 번 더 누르면 앱이 종료돼요', ToastAndroid.SHORT);
      return true;
    });
    return () => sub.remove();
  }, [nav, loggedIn]);
  return null;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.ttf'),
    'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.ttf'),
  });

  const onLayout = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreenModule.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.root} onLayout={onLayout}>
      <SafeAreaProvider>
        <AuthProvider>
          <ProjectsProvider>
            <NewProjectDraftProvider>
              <InvitationsProvider>
                <SyncProvider>
                  <InvitationFontsProvider>
                    <NavigationContainer>
                      <AndroidBackFallback />
                      <RootNavigator />
                    </NavigationContainer>
                  </InvitationFontsProvider>
                </SyncProvider>
              </InvitationsProvider>
            </NewProjectDraftProvider>
          </ProjectsProvider>
        </AuthProvider>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
});
