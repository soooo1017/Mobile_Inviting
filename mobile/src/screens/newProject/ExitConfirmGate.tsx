import { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { usePreventRemove, useNavigation } from '@react-navigation/native';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { color } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';

/** B7f — 새 초대장 작성 중 어느 단계에서든 ←/OS 뒤로가기 시 확인 모달을 거친다. */
export function ExitConfirmGate() {
  const navigation = useNavigation();
  const [pending, setPending] = useState<{ action: Parameters<typeof navigation.dispatch>[0] } | null>(null);

  usePreventRemove(true, ({ data }) => {
    // 뒤로가기(헤더/OS/스와이프)만 확인 모달을 거친다. '제작 시작하기' 등 다른 이탈 액션은 그대로 통과시킨다.
    if (data.action.type !== 'GO_BACK') {
      navigation.dispatch(data.action);
      return;
    }
    setPending({ action: data.action });
  });

  return (
    <ConfirmDialog
      visible={pending != null}
      title="작성을 그만둘까요?"
      cancelLabel="계속 작성"
      confirmLabel="그만두기"
      onCancel={() => setPending(null)}
      onConfirm={() => {
        if (pending) navigation.dispatch(pending.action);
        setPending(null);
      }}
    >
      <Text style={styles.body}>현재까지 작성한 내용은 저장되지 않습니다.</Text>
    </ConfirmDialog>
  );
}

const styles = StyleSheet.create({
  body: {
    ...textStyle({ size: 'body', weight: 'regular', color: color.ink.muted }),
    lineHeight: 12.5 * 1.7,
  },
});
