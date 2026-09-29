import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { Placeholder } from '../components/Placeholder';
import { color, motion } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const { auth, bootstrap } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    bootstrap();
    const timer = setTimeout(() => setMinTimeElapsed(true), motion.splashDuration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (minTimeElapsed && auth.status !== 'unknown') {
      navigation.replace(auth.status === 'authed' ? 'Home' : 'HomeGuest');
    }
  }, [minTimeElapsed, auth.status, navigation]);

  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        <Placeholder circle width={64} height={64} label="로고" />
        <View style={styles.textGroup}>
          <Placeholder width={168} height={28} label="앱 이름" />
          <Placeholder width={120} height={18} label="로고 문구" />
        </View>
      </View>
      <View style={styles.loadingTrack}>
        <View style={styles.loadingFill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: 16,
  },
  textGroup: {
    alignItems: 'center',
    gap: 7,
  },
  loadingTrack: {
    position: 'absolute',
    bottom: 46,
    width: 26,
    height: 2,
    borderRadius: 1,
    backgroundColor: color.line.default,
    overflow: 'hidden',
  },
  loadingFill: {
    width: '60%',
    height: '100%',
    backgroundColor: color.accent.base,
  },
});
