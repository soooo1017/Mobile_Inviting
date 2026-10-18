import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Safe area for full-screen Modals. SafeAreaView measures its insets natively and gets
 * zero inside a Modal on iOS, so the content ran under the status bar. The app-level
 * provider's insets are the screen's own, so pad with those instead.
 */
export function ModalSafeArea({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[style, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>{children}</View>;
}
