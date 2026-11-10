import { useState } from 'react';
import { Image, Pressable, Share, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useProjects } from '../../state/ProjectsContext';
import { useInvitation } from '../../state/InvitationsContext';
import { KeyboardAwareForm } from '../../components/KeyboardAwareForm';
import { TextField } from '../../components/TextField';
import { coverPhoto } from '../../editor/photos';
import { defaultShareDescription } from '../../editor/format';
import { DarkToast } from '../../editor/ui';
import { isLinkLocked, shareUrl, shareUrlLabel } from '../../share/link';
import { useLinkChange } from '../../share/useLinkChange';
import { ShareControl } from './ShareControl';
import Svg, { Path, Rect } from 'react-native-svg';
import type { Project, ProjectLink } from '../../types/project';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { getProjectStatus } from '../../utils/projectStatus';
import { ManageHeader, manageStyles } from '../manage/common';

type Props = NativeStackScreenProps<RootStackParamList, 'Share'>;

/**
 * 공유하기 (C17) — 링크는 초대장을 만들 때 이미 정해져 있어서, 공유 전에도 링크 · QR · 홍보물을 쓸 수 있어요.
 * 공유를 시작해야 다른 사람이 초대장을 볼 수 있어요.
 */
export function ShareScreen({ navigation, route }: Props) {
  const { getProject, setShared, setLink } = useProjects();
  const project = getProject(route.params.projectId);
  const [toast, setToast] = useState<string | null>(null);

  if (!project) return <SafeAreaView style={manageStyles.screen} />;
  return <ShareBody project={project} navigation={navigation} setShared={setShared} setLink={setLink} toast={toast} setToast={setToast} />;
}

function ShareBody({ project, navigation, setShared, setLink, toast, setToast }: { project: Project; navigation: Props['navigation']; setShared: (id: string, shared: boolean) => void; setLink: (id: string, link: ProjectLink) => void; toast: string | null; setToast: (m: string | null) => void }) {
  const linkChange = useLinkChange(project, (link) => {
    setLink(project.id, link);
    setToast('링크를 바꿨어요');
  });
  const projectId = project.id;
  const started = getProjectStatus(project) !== 'draft';
  const url = shareUrl(project);
  const locked = isLinkLocked(project);

  const copy = async () => {
    await Clipboard.setStringAsync(url);
    setToast('링크를 복사했어요');
  };
  // 폰의 공유창이 열려요 — 거기서 카카오톡 등 보낼 앱을 골라요.
  const share = () => {
    Share.share({ message: url }).catch(() => setToast('공유창을 열지 못했어요'));
  };

  return (
    <SafeAreaView style={manageStyles.screen} edges={['top', 'bottom']}>
      <ManageHeader title="공유하기" onBack={() => navigation.goBack()} />
      <KeyboardAwareForm contentContainerStyle={manageStyles.body}>
        <ShareControl
          project={project}
          hideLink
          onLinkChange={(link) => {
            setLink(projectId, link);
            setToast('링크를 바꿨어요');
          }}
          onChange={(shared) => {
            setShared(projectId, shared);
            setToast(shared ? '공유를 시작했어요 · 링크가 열려요' : '공유를 중지했어요');
          }}
        />
        <View style={styles.linkBox}>
          <Text style={styles.label}>초대장 링크</Text>
          <View style={styles.urlRow}>
            <Text style={styles.url} selectable>
              {shareUrlLabel(project)}
            </Text>
            <Pressable onPress={copy} style={styles.copyBtn} accessibilityLabel="링크 복사" hitSlop={6}>
              <CopyIcon />
            </Pressable>
          </View>
          {locked ? <Text style={styles.lockNote}>한 번 공유를 시작한 링크라서 바꿀 수 없어요.</Text> : null}
          <View style={styles.twoBtns}>
            <Pressable onPress={linkChange.open} disabled={locked} style={[manageStyles.outlineBtn, styles.flex, locked && manageStyles.off]}>
              <Text style={manageStyles.outlineBtnLabel}>링크 변경</Text>
            </Pressable>
            <Pressable onPress={share} disabled={!started} style={[styles.shareBtn, styles.flex, !started && manageStyles.off]}>
              <Text style={styles.shareLabel}>공유하기</Text>
            </Pressable>
          </View>
        </View>

        <SharePreview project={project} />

        {started ? null : (
          <View style={styles.band}>
            <Text style={styles.bandText}>{'QR · 홍보물은 지금도 미리 만들어 볼 수 있어요.'}</Text>
          </View>
        )}
        <View style={manageStyles.card}>
          <Pressable onPress={() => navigation.navigate('Qr', { projectId })} style={styles.row}>
            <View style={styles.thumb}>
              <QRCode value={url} size={26} color="#111111" backgroundColor="#ffffff" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>QR 코드</Text>
              <Text style={styles.rowSub}>QR 이미지로 저장</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Poster', { projectId })} style={[styles.row, manageStyles.divider]}>
            <View style={styles.thumb}>
              <Text style={styles.thumbGlyph}>▤</Text>
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>홍보물 만들기</Text>
              <Text style={styles.rowSub}>사진 · 초대 멘트 · 행사 정보 · QR</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </KeyboardAwareForm>

      {linkChange.nodes}
      <DarkToast message={toast} onHide={() => setToast(null)} bottom={90} />
    </SafeAreaView>
  );
}

/**
 * 공유 미리보기 — 카카오톡 · 문자로 링크를 보낼 때 보이는 카드. 사진은 대표 사진(에디터 ⚙ 전체 설정), 제목은 초대장 이름(프로젝트 설정),
 * 설명은 여기서 고쳐요(비우면 일시 · 장소). 이미 보낸 링크는 카카오톡이 미리보기를 저장해 둬서 바로 안 바뀌어요.
 */
function SharePreview({ project }: { project: Project }) {
  const { invitation, setShareDescription } = useInvitation(project.id);
  const cover = invitation ? coverPhoto(invitation) : undefined;
  const auto = defaultShareDescription(project.eventAt, project.venue?.name);
  const saved = invitation?.shareDescription ?? '';
  // 입력하는 동안은 입력 중인 글을, 아니면 저장된 글을 보여줘요(입력칸을 벗어나면 저장).
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? saved;
  const commit = () => {
    if (draft === null) return;
    setShareDescription(draft);
    setDraft(null);
  };
  return (
    <View style={styles.previewBox}>
      <Text style={styles.label}>공유 미리보기</Text>
      <View style={styles.card}>
        {cover ? <Image source={{ uri: cover.uri }} style={styles.cardImage} resizeMode="cover" /> : <View style={[styles.cardImage, styles.cardNoImage]} />}
        <View style={styles.cardText}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {project.title}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {value.trim() || auto}
          </Text>
          <Text style={styles.cardHost}>{shareUrlLabel(project).split('/')[0]}</Text>
        </View>
      </View>
      <Text style={styles.previewLabel}>설명</Text>
      <TextField value={value} onChangeText={setDraft} onBlur={commit} onSubmitEditing={commit} placeholder={auto} maxLength={60} returnKeyType="done" />
      <Text style={styles.lockNote}>
        {'사진은 초대장의 대표 사진(에디터 ⚙ 전체 설정), 제목은 초대장 이름(프로젝트 설정)이에요. 설명을 비우면 일시 · 장소가 들어가요.\n이미 보낸 링크는 카카오톡이 미리보기를 저장해 두어서 바로 바뀌지 않아요.'}
      </Text>
    </View>
  );
}

/** 링크 복사 아이콘 (겹친 두 장). */
function CopyIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke={color.ink.secondary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={6} y={6} width={9} height={9} rx={2} />
      <Path d="M12 6V4.5A1.5 1.5 0 0 0 10.5 3h-6A1.5 1.5 0 0 0 3 4.5v6A1.5 1.5 0 0 0 4.5 12H6" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  previewBox: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    padding: space[6],
    gap: space[4],
  },
  card: {
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.input,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  cardImage: {
    width: '100%',
    height: 140,
    backgroundColor: color.bg.canvas,
  },
  cardNoImage: {
    borderBottomWidth: 1,
    borderBottomColor: color.line.default,
  },
  cardText: {
    padding: space[5],
    gap: 3,
  },
  cardTitle: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  cardDesc: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.secondary }),
  },
  cardHost: {
    ...textStyle({ size: 'micro', weight: 'regular', color: color.ink.muted }),
    marginTop: 2,
  },
  previewLabel: {
    ...textStyle({ size: 'small', weight: 'medium', color: color.ink.label }),
  },
  flex: {
    flex: 1,
  },
  linkBox: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    padding: space[6],
    gap: space[4],
  },
  label: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.label }),
  },
  urlRow: {
    flexDirection: 'row',
    gap: space[3],
    alignItems: 'stretch',
  },
  url: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.secondary }),
    flex: 1,
    backgroundColor: color.bg.canvas,
    borderRadius: radius.input,
    paddingHorizontal: space[5],
    paddingVertical: space[4],
  },
  copyBtn: {
    width: 44,
    borderWidth: 1,
    borderColor: color.line.chip,
    borderRadius: radius.input,
    backgroundColor: color.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockNote: {
    ...textStyle({ size: 'micro', weight: 'regular', color: color.ink.muted }),
  },
  twoBtns: {
    flexDirection: 'row',
    gap: space[3],
  },
  shareBtn: {
    backgroundColor: color.ink.primary,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.onPrimary }),
  },
  band: {
    backgroundColor: color.accent.tint,
    borderWidth: 1,
    borderColor: color.accent.tintBorder,
    borderRadius: radius.input,
    paddingHorizontal: space[5],
    paddingVertical: space[4],
  },
  bandText: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.secondary }),
    lineHeight: 19,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingHorizontal: space[6],
    paddingVertical: space[5],
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.line.default,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGlyph: {
    ...textStyle({ size: 'title3', weight: 'regular', color: color.ink.secondary }),
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  rowSub: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  chevron: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.placeholder }),
  },
  start: {
    backgroundColor: color.ink.primary,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.onPrimary }),
  },
});
