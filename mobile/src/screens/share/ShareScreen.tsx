import { useState } from 'react';
import { Pressable, ScrollView, Share, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useProjects } from '../../state/ProjectsContext';
import { DarkToast } from '../../editor/ui';
import { shareUrl, shareUrlLabel } from '../../share/link';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { getProjectStatus } from '../../utils/projectStatus';
import { ManageHeader, manageStyles } from '../manage/common';

type Props = NativeStackScreenProps<RootStackParamList, 'Share'>;

/**
 * 공유하기 (C17) — 링크는 초대장을 만들 때 이미 정해져 있어서, 공유 전에도 링크 · QR · 홍보물을 쓸 수 있어요.
 * 공유를 시작해야 다른 사람이 초대장을 볼 수 있어요 (게스트 화면은 서버 연결 뒤에 열려요).
 */
export function ShareScreen({ navigation, route }: Props) {
  const { getProject, updateProject } = useProjects();
  const project = getProject(route.params.projectId);
  const [toast, setToast] = useState<string | null>(null);

  if (!project) return <SafeAreaView style={manageStyles.screen} />;
  const projectId = project.id;
  const started = getProjectStatus(project) !== 'draft';
  const url = shareUrl(project);

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
      <ScrollView contentContainerStyle={manageStyles.body}>
        <View style={styles.linkBox}>
          <Text style={styles.label}>초대장 링크</Text>
          <Text style={styles.url} selectable>
            {shareUrlLabel(project)}
          </Text>
          <View style={styles.twoBtns}>
            <Pressable onPress={copy} style={[manageStyles.outlineBtn, styles.flex]}>
              <Text style={manageStyles.outlineBtnLabel}>링크 복사</Text>
            </Pressable>
            <Pressable onPress={share} disabled={!started} style={[styles.shareBtn, styles.flex, !started && manageStyles.off]}>
              <Text style={styles.shareLabel}>공유하기</Text>
            </Pressable>
          </View>
        </View>

        {started ? null : (
          <View style={styles.band}>
            <Text style={styles.bandText}>
              {'공유를 시작하기 전에는 다른 사람이 링크를 열면 "준비 중" 화면이 보여요.\nQR · 홍보물은 지금도 미리 만들어 볼 수 있어요.'}
            </Text>
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
      </ScrollView>

      {started ? null : (
        <View style={manageStyles.footer}>
          <Pressable
            onPress={() => {
              updateProject(projectId, { shared: true });
              setToast('공유를 시작했어요 · 게스트 화면은 서버 연결 뒤에 열려요');
            }}
            style={styles.start}
          >
            <Text style={styles.startLabel}>공유 시작하기</Text>
          </Pressable>
        </View>
      )}
      <DarkToast message={toast} onHide={() => setToast(null)} bottom={90} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  url: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.secondary }),
    backgroundColor: color.bg.canvas,
    borderRadius: radius.input,
    paddingHorizontal: space[5],
    paddingVertical: space[4],
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
