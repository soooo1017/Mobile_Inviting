import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreenModule from 'expo-splash-screen';
import { AuthProvider } from './src/state/AuthContext';
import { ProjectsProvider } from './src/state/ProjectsContext';
import { NewProjectDraftProvider } from './src/state/NewProjectDraftContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { color } from './src/theme/tokens';

SplashScreenModule.preventAutoHideAsync().catch(() => {});

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
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
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
