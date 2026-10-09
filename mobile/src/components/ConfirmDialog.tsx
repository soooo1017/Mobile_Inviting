import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = {
  visible: boolean;
  title: string;
  children?: React.ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
};

export function ConfirmDialog({
  visible,
  title,
  children,
  cancelLabel = '취소',
  confirmLabel,
  onCancel,
  onConfirm,
  confirmDisabled,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel} />
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {children}
          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.confirmButton, confirmDisabled && styles.confirmDisabled]}
              onPress={onConfirm}
              disabled={confirmDisabled}
            >
              <Text style={styles.confirmLabel}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: color.overlay.modal,
  },
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: color.bg.surface,
    borderRadius: radius.modal,
    padding: space[8],
    gap: space[5],
  },
  title: {
    ...textStyle({ size: 'modalTitle', weight: 'semibold', lineHeight: 'heading', color: color.ink.primary }),
  },
  actions: {
    flexDirection: 'row',
    gap: space[4],
    marginTop: space[3],
  },
  button: {
    flex: 1,
    borderRadius: radius.button,
    paddingVertical: space[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.chip,
  },
  cancelLabel: {
    ...textStyle({ size: 'control', weight: 'medium', color: color.ink.primary }),
  },
  confirmButton: {
    backgroundColor: color.status.error,
  },
  confirmDisabled: {
    opacity: 0.45,
  },
  confirmLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: '#ffffff' }),
  },
});
