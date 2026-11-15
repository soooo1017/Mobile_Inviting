import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import { Image, View, StyleSheet, type HostInstance } from 'react-native';
import { File } from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { Canvas } from '../editor/canvas/Canvas';
import { CanvasContext, type CanvasContextValue } from '../editor/canvas/CanvasContext';
import { SimpleThanksView } from '../editor/canvas/SimpleThanks';
import { invitationTheme } from '../editor/invitationTheme';
import { blockPhotos, coverPhoto } from '../editor/photos';
import { DEFAULT_THANKS_PAGE, useInvitation } from '../state/InvitationsContext';
import type { Block, Photo } from '../editor/types';
import type { Project } from '../types/project';

export type PageKind = 'invitation' | 'thanks';
export type CaptureResult = { bytes: Uint8Array; width: number; height: number };
export type CaptureHandle = {
  /** 초대장 · 감사페이지를 손님이 보는 모습 그대로 한 장의 사진으로 찍어요. 실패하면 null. */
  capture: (kind: PageKind, format: 'png' | 'jpg') => Promise<CaptureResult | null>;
};

/** 찍는 폭(논리 픽셀) — 일반 폰 화면 폭이에요. 손님 폰에서 보이는 줄바꿈과 비슷해요. */
export const CAPTURE_WIDTH = 390;
/** 찍은 사진의 세로 픽셀 상한 — 너무 길면 폰 메모리가 모자라서, 긴 초대장은 선명도를 조금 낮춰요. */
const MAX_PIXEL_HEIGHT = 7000;
const MAX_SCALE = 2.5;
const SIMPLE_THANKS_HEIGHT = 800;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * 화면 밖에 초대장(또는 감사페이지)을 그려 두고 사진으로 찍는 숨은 화면 — [데이터 내려받기]의 이미지 · PDF가 써요.
 * 편집 화면과 같은 그림 코드(Canvas)를 쓰고, 안내 팝업 · 편집 테두리 없이 '미리보기' 모습이에요. 눈에는 안 보여요.
 */
export function PageCapture({ project, ref }: { project: Project; ref?: Ref<CaptureHandle> }) {
  const { invitation } = useInvitation(project.id);
  const [kind, setKind] = useState<PageKind | null>(null);
  const shotRef = useRef<HostInstance>(null);
  const heightRef = useRef(0);
  const latest = useRef({ invitation, project });
  useEffect(() => {
    latest.current = { invitation, project };
  }, [invitation, project]);

  const theme = invitationTheme(project);
  const value = useMemo<CanvasContextValue | null>(
    () => (invitation ? { project, theme, defaultFont: invitation.font, mode: 'preview', showToast: () => {} } : null),
    [invitation, project, theme],
  );

  useImperativeHandle(ref, () => ({
    async capture(k, format) {
      const { invitation: inv } = latest.current;
      if (!inv) return null;
      try {
        heightRef.current = 0;
        setKind(k);
        // 서버에 올라간 사진(https)은 미리 받아 둬요 — 안 그러면 빈 칸으로 찍혀요. 폰 안의 사진은 금방 떠요.
        const photos: Photo[] = k === 'thanks' ? [coverPhoto(inv)].filter(Boolean) as Photo[] : inv.pages.invite.flatMap((b: Block) => blockPhotos(b));
        await Promise.all(photos.filter((p) => /^https?:/i.test(p.uri)).map((p) => Image.prefetch(p.uri).catch(() => false)));
        // 그려지고 높이가 더 안 변할 때까지 기다려요(최대 약 9초).
        let last = -1;
        let same = 0;
        for (let i = 0; i < 60 && same < 3; i += 1) {
          await sleep(150);
          const h = heightRef.current;
          same = h > 0 && h === last ? same + 1 : 0;
          last = h;
        }
        await sleep(400);
        const h = heightRef.current;
        if (!h) return null;
        const scale = Math.min(MAX_SCALE, MAX_PIXEL_HEIGHT / h);
        const width = Math.round(CAPTURE_WIDTH * scale);
        const height = Math.round(h * scale);
        const uri = await captureRef(shotRef, { format, quality: 0.92, result: 'tmpfile', width, height });
        const bytes = new Uint8Array(await new File(uri).arrayBuffer());
        return { bytes, width, height };
      } catch {
        return null;
      } finally {
        setKind(null);
      }
    },
  }));

  if (!kind || !invitation || !value) return null;
  const thanksPage = invitation.thanks ?? DEFAULT_THANKS_PAGE;
  const simpleThanks = kind === 'thanks' && thanksPage.mode === 'simple';
  const blocks = invitation.pages[kind === 'thanks' ? 'thanks' : 'invite'];
  return (
    <View pointerEvents="none" style={styles.host}>
      <CanvasContext.Provider value={value}>
        <View
          ref={shotRef}
          collapsable={false}
          onLayout={(e) => {
            heightRef.current = Math.round(e.nativeEvent.layout.height);
          }}
          style={{ width: CAPTURE_WIDTH, backgroundColor: theme.paper }}
        >
          {simpleThanks ? (
            <View style={{ height: SIMPLE_THANKS_HEIGHT }}>
              <SimpleThanksView simple={thanksPage.simple} photo={coverPhoto(invitation)} />
            </View>
          ) : (
            <Canvas blocks={blocks} />
          )}
        </View>
      </CanvasContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  // 화면 왼쪽 밖에 둬요 — 보이지는 않지만 실제로 그려져서 사진으로 찍을 수 있어요.
  host: { position: 'absolute', top: 0, left: -(CAPTURE_WIDTH + 60), width: CAPTURE_WIDTH },
});
