import { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Checkbox } from '../../components/Checkbox';
import { TextLink } from '../../components/TextLink';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import type { Project } from '../../types/project';
import { getProjectStatus } from '../../utils/projectStatus';

type Props = {
  visible: boolean;
  project: Project | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteDialog({ visible, project, onCancel, onConfirm }: Props) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [wasVisible, setWasVisible] = useState(visible);

  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setAcknowledged(false);
  }

  if (!project) return null;

  const isDraft = getProjectStatus(project) === 'draft';

  if (isDraft) {
    return (
      <ConfirmDialog
        visible={visible}
        title={`'${project.title}'을 삭제할까요?`}
        confirmLabel="삭제하기"
        onCancel={onCancel}
        onConfirm={onConfirm}
      >
        <Text style={styles.body}>작성한 내용과 사진은 모두 지워지고 복구할 수 없어요.</Text>
      </ConfirmDialog>
    );
  }

  return (
    <ConfirmDialog
      visible={visible}
      title="공유 중인 초대장이에요. 정말 삭제할까요?"
      confirmLabel="삭제하기"
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmDisabled={!acknowledged}
    >
      <Text style={styles.body}>초대장을 받은 사람들은 더 이상 링크를 열 수 없어요.</Text>

      <View style={styles.infoBox}>
        <InfoRow label="초대장 이름" value={project.title} />
        <InfoRow label="공유 링크" value="즉시 열리지 않음" valueColor={color.status.error} />
        <InfoRow label="RSVP 응답" value={`${project.counts.rsvp}건 삭제`} />
        <InfoRow label="방명록" value={`${project.counts.guestbook}건 삭제`} />
      </View>

      <TextLink size="label" weight="semibold" color={color.accent.base} underline onPress={() => {}}>
        응답 데이터 먼저 내려받기
      </TextLink>

      <View style={styles.ackRow}>
        <Checkbox checked={acknowledged} onPress={() => setAcknowledged((v) => !v)} />
        <Text style={styles.ackLabel}>공유 링크와 응답 데이터가 함께 삭제되는 것을 확인했어요</Text>
      </View>
    </ConfirmDialog>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    ...textStyle({ size: 'body', weight: 'regular', color: color.ink.muted }),
    lineHeight: 12.5 * 1.7,
  },
  infoBox: {
    backgroundColor: color.bg.sheet,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.input,
    padding: space[6],
    gap: space[5],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    ...textStyle({ size: 'chip', weight: 'regular', color: color.ink.secondary }),
  },
  infoValue: {
    ...textStyle({ size: 'chip', weight: 'semibold', color: color.ink.primary }),
  },
  ackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[5],
  },
  ackLabel: {
    flex: 1,
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.primary }),
    lineHeight: 11.5 * 1.4,
  },
});
