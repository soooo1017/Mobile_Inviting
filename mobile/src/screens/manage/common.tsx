import type { ReactNode } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { getProjectStatus } from '../../utils/projectStatus';
import type { Project } from '../../types/project';

/** 공유 전 = still a draft; responses, guestbook posts and visits only start after sharing. */
export function isShared(project: Project) {
  return getProjectStatus(project) !== 'draft';
}

export function ManageHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      {/* Same ← as the editor header (BackButton carries the wizard's top margin). */}
      <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="뒤로">
        <Text style={styles.back}>←</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

export function HeaderLink({ label, onPress, tone = 'accent' }: { label: string; onPress: () => void; tone?: 'accent' | 'danger' | 'muted' }) {
  return (
    <Pressable onPress={onPress} hitSlop={10}>
      <Text style={[styles.headerLink, tone === 'danger' && styles.danger, tone === 'muted' && styles.muted]}>{label}</Text>
    </Pressable>
  );
}

/** Centered guide with one action — 공유 전 안내, 초대장에 참석 응답/방명록이 없을 때. */
export function Guide({ icon, title, desc, action, onAction }: { icon?: string; title: string; desc: string; action: string; onAction: () => void }) {
  return (
    <View style={styles.guideWrap}>
      <View style={styles.guide}>
        {icon ? <Text style={styles.guideIcon}>{icon}</Text> : null}
        <Text style={styles.guideTitle}>{title}</Text>
        <Text style={styles.guideDesc}>{desc}</Text>
        <Pressable onPress={onAction} style={styles.guideBtn}>
          <Text style={styles.guideBtnLabel}>{action}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function NotShared({ what, onShare }: { what: string; onShare: () => void }) {
  return (
    <Guide
      icon="↗"
      title="아직 공유 전인 초대장이에요"
      desc={`초대장을 공유하면 게스트의 ${what}\n여기에 모여요.`}
      action="공유하러 가기"
      onAction={onShare}
    />
  );
}

/** Small quiet note for an empty list (공유는 했지만 아직 아무도 남기지 않았을 때). */
export function EmptyNote({ text }: { text: string }) {
  return (
    <View style={styles.emptyNote}>
      <Text style={styles.emptyNoteText}>{text}</Text>
    </View>
  );
}

export const manageStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  body: {
    paddingHorizontal: space.screenX,
    paddingBottom: space[10],
    gap: space[6],
  },
  card: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
  },
  footer: {
    paddingHorizontal: space.screenX,
    paddingTop: space[4],
    paddingBottom: space[6],
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: color.line.strong,
    backgroundColor: color.bg.surface,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outlineBtnLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  off: {
    opacity: 0.45,
  },
  help: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingHorizontal: space.screenX,
    paddingVertical: space[5],
  },
  back: {
    ...textStyle({ size: 'title1', weight: 'regular', color: color.ink.primary }),
  },
  title: {
    flex: 1,
    ...textStyle({ size: 'title3', weight: 'semibold', color: color.ink.primary }),
  },
  headerLink: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.accent.base }),
  },
  danger: {
    color: color.status.error,
  },
  muted: {
    color: color.ink.secondary,
  },
  guideWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.screenX,
    paddingBottom: 60,
  },
  guide: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: color.line.dashed,
    borderRadius: radius.card,
    paddingVertical: space[10],
    paddingHorizontal: space[8],
    alignItems: 'center',
    gap: space[4],
  },
  guideIcon: {
    fontSize: 24,
    color: color.accent.base,
  },
  guideTitle: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
    textAlign: 'center',
  },
  guideDesc: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
    textAlign: 'center',
    lineHeight: 20,
  },
  guideBtn: {
    marginTop: space[3],
    backgroundColor: color.ink.primary,
    borderRadius: radius.button,
    paddingHorizontal: space[8],
    paddingVertical: space[5],
  },
  guideBtnLabel: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.onPrimary }),
  },
  emptyNote: {
    paddingVertical: space[10],
    alignItems: 'center',
  },
  emptyNoteText: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
  },
});
