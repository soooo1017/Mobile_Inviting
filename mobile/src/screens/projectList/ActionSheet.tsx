import { getUnread, unreadText } from '../../utils/unread';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { BottomSheet } from '../../components/BottomSheet';
import { color, radius, space } from '../../theme/tokens';
import { textStyle, tnum } from '../../theme/typography';
import type { Project } from '../../types/project';
import { eventTypeMeta } from '../../types/project';
import { ProjectStatusChip } from '../../components/ProjectStatusChip';
import { formatDday, getProjectStatus } from '../../utils/projectStatus';

type Props = {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
  onEdit: () => void;
  onManage: () => void;
  onPreview: () => void;
  onCopyLink: () => void;
  onDelete: () => void;
};

export function ActionSheet({
  visible,
  project,
  onClose,
  onEdit,
  onManage,
  onPreview,
  onCopyLink,
  onDelete,
}: Props) {
  if (!project) return <BottomSheet visible={visible} onClose={onClose}><View /></BottomSheet>;

  const status = getProjectStatus(project);
  const unread = getUnread(project);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View style={styles.metaRow}>
          <ProjectStatusChip status={status} />
          <Text style={styles.metaText}>{eventTypeMeta(project.eventType).label}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={[styles.metaText, tnum]}>{formatDday(project.eventAt)}</Text>
        </View>
        <Text style={styles.title}>{project.title}</Text>
      </View>

      <View style={styles.bigButtons}>
        <Pressable style={[styles.bigButton, styles.bigButtonSelect]} onPress={onEdit}>
          <Text style={styles.bigButtonLabelSelected}>편집</Text>
          <Text style={styles.bigButtonSubSelected}>내용 · 디자인</Text>
        </Pressable>
        <Pressable style={[styles.bigButton, styles.bigButtonOutline]} onPress={onManage}>
          <View style={styles.manageHead}>
            <Text style={styles.bigButtonLabel}>관리</Text>
            {unread.total > 0 ? <View style={styles.newDot} /> : null}
          </View>
          <Text style={[styles.bigButtonSub, unread.total > 0 && styles.bigButtonSubNew]}>{unread.total > 0 ? unreadText(unread) : '응답 · 공유'}</Text>
        </Pressable>
      </View>

      <View style={styles.menu}>
        <MenuRow label="공유 링크 복사" onPress={onCopyLink} first />
        <MenuRow label="미리보기" onPress={onPreview} />
      </View>

      <View style={styles.deleteWrap}>
        <Pressable onPress={onDelete}>
          <Text style={styles.deleteLabel}>삭제하기</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

function MenuRow({ label, subtitle, onPress, first }: { label: string; subtitle?: string; onPress: () => void; first?: boolean }) {
  return (
    <Pressable style={[styles.menuRow, !first && styles.menuRowDivider]} onPress={onPress}>
      <Text style={styles.menuLabel}>{label}</Text>
      {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  manageHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  newDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d64545' },
  bigButtonSubNew: { color: color.status.error },
  header: {
    paddingHorizontal: space.screenX,
    gap: space[3],
    marginBottom: space[7],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  metaText: {
    ...textStyle({ size: 'caption', weight: 'medium', color: color.ink.secondary }),
  },
  metaDot: {
    color: color.line.strong,
  },
  title: {
    ...textStyle({ size: 'title3', weight: 'semibold', color: color.ink.primary }),
  },
  bigButtons: {
    flexDirection: 'row',
    gap: space[3],
    paddingHorizontal: space.screenX,
    marginBottom: space[7],
  },
  bigButton: {
    flex: 1,
    borderRadius: radius.button,
    paddingVertical: space[7],
    alignItems: 'center',
    gap: space[1],
  },
  bigButtonSelect: {
    backgroundColor: color.select.fill,
  },
  bigButtonOutline: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.select.fill,
  },
  bigButtonLabelSelected: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.select.on }),
  },
  bigButtonSubSelected: {
    ...textStyle({ size: 'caption', weight: 'regular', color: color.select.onSub }),
  },
  bigButtonLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.select.fill }),
  },
  bigButtonSub: {
    ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.muted }),
  },
  menu: {
    marginBottom: space[3],
  },
  menuRow: {
    paddingHorizontal: space.screenX,
    paddingVertical: 15,
  },
  menuRowDivider: {
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
  },
  menuLabel: {
    ...textStyle({ size: 'control', weight: 'medium', color: color.ink.primary }),
  },
  menuSubtitle: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    marginTop: space[1],
  },
  deleteWrap: {
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
    paddingHorizontal: space.screenX,
    paddingVertical: 15,
  },
  deleteLabel: {
    ...textStyle({ size: 'control', weight: 'medium', color: color.status.error }),
  },
});
