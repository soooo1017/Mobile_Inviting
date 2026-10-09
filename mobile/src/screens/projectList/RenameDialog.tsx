import { useState } from 'react';
import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { TextField } from '../../components/TextField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';

type Props = {
  visible: boolean;
  initialValue: string;
  onCancel: () => void;
  onSave: (value: string) => void;
};

export function RenameDialog({ visible, initialValue, onCancel, onSave }: Props) {
  const [value, setValue] = useState(initialValue);
  const [wasVisible, setWasVisible] = useState(visible);

  // Reset the draft text each time the sheet opens — a render-time state
  // adjustment (per React's "resetting state when a prop changes" guidance)
  // instead of an effect, since the component stays mounted while `visible`
  // toggles.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setValue(initialValue);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel} />
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.title}>이름 바꾸기</Text>
          <TextField value={value} onChangeText={setValue} autoFocus />
          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelLabel}>취소</Text>
            </Pressable>
            <View style={styles.saveButtonWrap}>
              <PrimaryButton label="저장" onPress={() => onSave(value.trim() || initialValue)} disabled={!value.trim()} />
            </View>
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
    gap: space[6],
  },
  title: {
    ...textStyle({ size: 'modalTitle', weight: 'semibold', color: color.ink.primary }),
  },
  actions: {
    flexDirection: 'row',
    gap: space[4],
  },
  button: {
    borderRadius: radius.button,
    paddingVertical: space[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingHorizontal: space[8],
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.chip,
  },
  cancelLabel: {
    ...textStyle({ size: 'control', weight: 'medium', color: color.ink.primary }),
  },
  saveButtonWrap: {
    flex: 1,
  },
});
