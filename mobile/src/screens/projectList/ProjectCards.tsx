import { Pressable, Text, View, StyleSheet } from 'react-native';
import { color, radius, space } from '../../theme/tokens';
import { textStyle, tnum } from '../../theme/typography';
import type { Project } from '../../types/project';
import { eventTypeMeta } from '../../types/project';
import { ProjectStatusChip, ThanksSetChip } from '../../components/ProjectStatusChip';
import {
  formatDday,
  formatEventDateTime,
  getBottomLine,
  getProjectStatus,
  getThanksBanner,
  shouldShowThanksSetChip,
} from '../../utils/projectStatus';
import { ProjectThumb } from './ProjectThumb';

type Props = {
  project: Project;
  onPress: () => void;
};

function Banner({ tone, text }: { tone: 'soon' | 'warn'; text: string; actionLabel?: string; onAction?: () => void }) {
  const palette = tone === 'soon'
    ? { bg: color.accent.tint, fg: color.accent.base }
    : { bg: color.status.errorTint, fg: color.status.error };
  return (
    <View style={[styles.banner, { backgroundColor: palette.bg }]}>
      <Text style={[styles.bannerText, { color: palette.fg }]}>{text}</Text>
    </View>
  );
}

export function ProjectDetailCard({ project, onPress }: Props) {
  const status = getProjectStatus(project);
  const banner = getThanksBanner(project, status);
  const bottomLine = getBottomLine(project, status);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.detailCard, status === 'past' && { backgroundColor: color.bg.cardPast }]}
    >
      <View style={styles.detailMain}>
        <ProjectThumb themeId={project.themeId} style={styles.detailThumb} />
        <View style={styles.detailInfo}>
          <View style={styles.metaRow}>
            <ProjectStatusChip status={status} />
            <Text style={styles.metaText}>{eventTypeMeta(project.eventType).label}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={[styles.metaText, tnum]}>{formatDday(project.eventAt)}</Text>
          </View>
          <Text style={styles.detailTitle} numberOfLines={1}>{project.title}</Text>
          <Text style={[styles.detailDateVenue, tnum]}>
            {formatEventDateTime(project.eventAt)}
            {project.venue ? `\n${project.venue.name}` : ''}
          </Text>
          <Text style={[styles.bottomLine, bottomLine.accent && { color: color.accent.base }]}>{bottomLine.text}</Text>
        </View>
      </View>
      {banner ? <Banner tone={banner.tone} text={banner.text} /> : null}
    </Pressable>
  );
}

export function ProjectThumbCard({ project, onPress }: Props) {
  const status = getProjectStatus(project);
  const showThanksChip = shouldShowThanksSetChip(project, status);

  return (
    <Pressable onPress={onPress} style={styles.thumbCardWrap}>
      <View style={styles.thumbImageWrap}>
        <ProjectThumb themeId={project.themeId} style={styles.thumbImage} />
        <View style={styles.thumbChipRow}>
          <ProjectStatusChip status={status} />
          {showThanksChip ? <ThanksSetChip /> : null}
        </View>
      </View>
      <Text style={styles.thumbTitle} numberOfLines={1}>{project.title}</Text>
    </Pressable>
  );
}

export function ProjectListRow({ project, onPress }: Props) {
  const status = getProjectStatus(project);
  const banner = getThanksBanner(project, status);
  const typeLabel = eventTypeMeta(project.eventType).label;

  return (
    <Pressable onPress={onPress} style={styles.listRow}>
      <View style={styles.listLeft}>
        <Text style={styles.listTitle} numberOfLines={1}>{project.title}</Text>
        <Text style={[styles.listMeta, tnum]}>{typeLabel} · {formatEventDateTime(project.eventAt)}</Text>
        {project.venue ? <Text style={styles.listMeta}>{project.venue.name}</Text> : null}
        {banner ? (
          <Text style={[styles.listBanner, { color: banner.tone === 'warn' ? color.status.error : color.accent.base }]}>
            {banner.text}
          </Text>
        ) : null}
      </View>
      <View style={styles.listRight}>
        <ProjectStatusChip status={status} />
        <Text style={[styles.listDday, tnum]}>{formatDday(project.eventAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Detail card
  detailCard: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    padding: space[7],
  },
  detailMain: {
    flexDirection: 'row',
    gap: space[6],
  },
  detailThumb: {
    width: 62,
    height: 78,
    borderRadius: 6,
  },
  detailInfo: {
    flex: 1,
    gap: space[3],
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
  detailTitle: {
    ...textStyle({ size: 'title3', weight: 'semibold', color: color.ink.primary }),
  },
  detailDateVenue: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
    lineHeight: 11.5 * 1.5,
  },
  bottomLine: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.secondary }),
    marginTop: space[1],
  },
  banner: {
    marginTop: space[6],
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  bannerText: {
    ...textStyle({ size: 'label', weight: 'medium' }),
  },

  // Thumb card
  thumbCardWrap: {
    flex: 1,
    gap: space[3],
  },
  thumbImageWrap: {
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 8,
  },
  thumbChipRow: {
    position: 'absolute',
    top: space[3],
    left: space[3],
    flexDirection: 'row',
    gap: space[2],
  },
  thumbTitle: {
    ...textStyle({ size: 'button2', weight: 'semibold', color: color.ink.primary }),
  },

  // List row
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: space[7],
    gap: space[5],
  },
  listLeft: {
    flex: 1,
    gap: space[1],
  },
  listTitle: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  listMeta: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  listBanner: {
    ...textStyle({ size: 'small', weight: 'medium' }),
    marginTop: space[1],
  },
  listRight: {
    alignItems: 'flex-end',
    gap: space[3],
  },
  listDday: {
    ...textStyle({ size: 'small', weight: 'medium', color: color.ink.secondary }),
  },
});
