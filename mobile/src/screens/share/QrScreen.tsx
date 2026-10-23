import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useProjects } from '../../state/ProjectsContext';
import { DarkToast } from '../../editor/ui';
import { saveImageToPhotos } from '../../share/imageOut';
import { SaveDeniedDialog } from '../../share/SaveDeniedDialog';
import { shareUrl } from '../../share/link';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { ManageHeader, manageStyles } from '../manage/common';

type Props = NativeStackScreenProps<RootStackParamList, 'Qr'>;

/** 저장되는 QR 이미지의 한 변 (px). */
const QR_IMAGE_PX = 1024;

/** QR 코드 — 초대장 링크의 QR을 크게 보여주고 사진첩에 이미지로 저장해요. 색은 읽히도록 검정 · 흰 배경 고정. */
export function QrScreen({ navigation, route }: Props) {
  const { getProject } = useProjects();
  const project = getProject(route.params.projectId);
  const imageRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  if (!project) return <SafeAreaView style={manageStyles.screen} />;
  const url = shareUrl(project);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const uri = await captureRef(imageRef, { format: 'png', quality: 1, result: 'tmpfile', width: QR_IMAGE_PX, height: QR_IMAGE_PX });
      const result = await saveImageToPhotos(uri);
      if (result === 'saved') setToast('사진첩에 저장했어요');
      else setDenied(true);
    } catch {
      setToast('이미지를 만들지 못했어요');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await Clipboard.setStringAsync(url);
    setToast('링크를 복사했어요');
  };

  return (
    <SafeAreaView style={manageStyles.screen} edges={['top', 'bottom']}>
      <ManageHeader title="QR 코드" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={manageStyles.body}>
        <View style={styles.card}>
          {/* 이 흰 네모가 그대로 이미지로 저장돼요. */}
          <View ref={imageRef} collapsable={false} style={styles.qrImage}>
            <QRCode value={url} size={196} color="#111111" backgroundColor="#ffffff" ecl="M" />
          </View>
          <Text style={styles.caption}>이 QR을 찍으면 초대장 링크로 연결돼요</Text>
        </View>
        <Pressable onPress={save} disabled={busy} style={[styles.primary, busy && manageStyles.off]}>
          <Text style={styles.primaryLabel}>QR 이미지 저장</Text>
        </Pressable>
        <Pressable onPress={copy} style={manageStyles.outlineBtn}>
          <Text style={manageStyles.outlineBtnLabel}>링크 복사</Text>
        </Pressable>
        <Text style={manageStyles.help}>{'청첩장 · 현수막 · 안내문에 넣어 쓸 수 있어요.\n인쇄할 때는 가로 · 세로 2cm 이상으로 넣어 주세요.'}</Text>
      </ScrollView>
      <SaveDeniedDialog visible={denied} onClose={() => setDenied(false)} />
      <DarkToast message={toast} onHide={() => setToast(null)} bottom={40} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    padding: space[8],
    alignItems: 'center',
    gap: space[5],
  },
  qrImage: {
    backgroundColor: '#ffffff',
    padding: 16,
  },
  caption: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    textAlign: 'center',
  },
  primary: {
    backgroundColor: color.ink.primary,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.onPrimary }),
  },
});
