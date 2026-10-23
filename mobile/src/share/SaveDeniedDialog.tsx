import { Linking, Text, StyleSheet } from 'react-native';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { color } from '../theme/tokens';
import { textStyle } from '../theme/typography';

/** 사진 저장을 거부했거나 저장에 실패했을 때 — 설정으로 안내해요. */
export function SaveDeniedDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <ConfirmDialog
      visible={visible}
      title="사진 저장이 꺼져 있어요"
      cancelLabel="닫기"
      confirmLabel="설정 열기"
      onCancel={onClose}
      onConfirm={() => {
        onClose();
        Linking.openSettings().catch(() => {});
      }}
    >
      <Text style={styles.body}>{'설정에서 사진 추가를 허용하면\n이미지를 저장할 수 있어요.'}</Text>
    </ConfirmDialog>
  );
}

const styles = StyleSheet.create({
  body: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.secondary }),
    lineHeight: 21,
  },
});
