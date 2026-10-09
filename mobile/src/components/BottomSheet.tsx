import { Modal, Pressable, Text, View, StyleSheet, type ViewStyle } from 'react-native';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: ViewStyle['maxHeight'];
};

export function BottomSheet({ visible, onClose, title, children, maxHeight }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, maxHeight ? { maxHeight } : null]}>
        <View style={styles.grabber} />
        {title ? (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
        ) : null}
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: color.overlay.sheet,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: color.bg.sheet,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingBottom: space[9],
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.line.chip,
    marginTop: space[3],
    marginBottom: space[5],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
    marginBottom: space[7],
  },
  title: {
    ...textStyle({ size: 'sheetTitle', weight: 'semibold', color: color.ink.primary }),
  },
  close: {
    ...textStyle({ size: 'title2', weight: 'regular', color: color.ink.secondary }),
  },
});
