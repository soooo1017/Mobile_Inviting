import { Pressable, Text, View, StyleSheet } from 'react-native';
import { BottomSheet } from '../../components/BottomSheet';
import { color, radius, space } from '../../theme/tokens';
import { textStyle, tnum } from '../../theme/typography';
import type { Project } from '../../types/project';
import { eventTypeMeta } from '../../types/project';
import { ProjectStatusChip } from '../../components/ProjectStatusChip';
import { formatDday, formatThanksPeriod, getProjectStatus } from '../../utils/projectStatus';

type Props = {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
  onEdit: () => void;
  onManage: () => void;
  onPreview: () => void;
  onCopyLink: () => void;
  onDelete: () => void;
  onThanksPeriod: () => void;
  onThanksEdit: () => void;
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
  onThanksPeriod,
  onThanksEdit,
}: Props) {
  if (!project) return <BottomSheet visible={visible} onClose={onClose}><View /></BottomSheet>;

  const status = getProjectStatus(project);

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
          <Text style={styles.bigButtonSubSelected}>블록 · 디자인</Text>
        </Pressable>
        <Pressable style={[styles.bigButton, styles.bigButtonOutline]} onPress={onManage}>
          <Text style={styles.bigButtonLabel}>관리</Text>
          <Text style={styles.bigButtonSub}>응답 · 공유 · 설정</Text>
        </Pressable>
      </View>

      <ThanksBox project={project} onPeriod={onThanksPeriod} onEdit={onThanksEdit} />

      <View style={styles.menu}>
        <MenuRow label="미리보기" onPress={onPreview} first />
        <MenuRow label="공유 링크 복사" onPress={onCopyLink} />
      </View>

      <View style={styles.deleteWrap}>
        <Pressable onPress={onDelete}>
          <Text style={styles.deleteLabel}>삭제하기</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

function ThanksBox({ project, onPeriod, onEdit }: { project: Project; onPeriod: () => void; onEdit: () => void }) {
  const enabled = project.thanks.enabled;
  const period = formatThanksPeriod(project);

  return (
    <View style={styles.thanksBox}>
      <View style={styles.thanksHeader}>
        <Text style={styles.thanksTitle}>감사 페이지 설정</Text>
        <View style={[styles.thanksBadge, enabled ? styles.thanksBadgeOn : styles.thanksBadgeOff]}>
          <Text style={[styles.thanksBadgeLabel, { color: enabled ? color.status.success : color.status.error }]}>
            {enabled ? '설정' : '미설정'}
          </Text>
        </View>
      </View>
      {enabled && period ? <Text style={styles.thanksPeriod}>기간 : {period} ({project.thanks.days}일)</Text> : null}
      <Text style={styles.thanksDesc}>
        {enabled
          ? '공유한 링크에서 자동으로 감사 페이지로 전환되어 행사에 참석해주신 분들에게 감사 인사를 드려요.'
          : '행사 종료일 이후에는 초대장 접속이 불가합니다.\n행사에 참석해주신 분들에게 감사 인사를 드리고 싶으시면 감사 페이지를 설정해주세요.'}
      </Text>
      <View style={styles.thanksButtons}>
        <Pressable style={styles.thanksButton} onPress={onPeriod}>
          <Text style={styles.thanksButtonLabel}>{enabled ? '기간 변경' : '기간 설정'}</Text>
        </Pressable>
        <Pressable style={styles.thanksButton} onPress={onEdit}>
          <Text style={styles.thanksButtonLabel}>감사 페이지 편집</Text>
        </Pressable>
      </View>
    </View>
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
  thanksBox: {
    marginHorizontal: space.screenX,
    marginBottom: space[7],
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    padding: space[7],
    gap: space[5],
  },
  thanksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thanksTitle: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  thanksBadge: {
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
  },
  thanksBadgeOn: {
    backgroundColor: color.status.successTint,
    borderColor: color.status.successBorder,
  },
  thanksBadgeOff: {
    backgroundColor: color.status.errorTint,
    borderColor: color.status.errorBorder,
  },
  thanksBadgeLabel: {
    ...textStyle({ size: 'small', weight: 'semibold' }),
  },
  thanksPeriod: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.primary }),
  },
  thanksDesc: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
    lineHeight: 11.5 * 1.5,
  },
  thanksButtons: {
    flexDirection: 'row',
    gap: space[4],
  },
  thanksButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: color.line.chip,
    borderRadius: 8,
    paddingVertical: space[4],
    alignItems: 'center',
  },
  thanksButtonLabel: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.primary }),
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
