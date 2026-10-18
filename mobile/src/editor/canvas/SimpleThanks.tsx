import { View, StyleSheet } from 'react-native';
import { useCanvas } from './CanvasContext';
import { InvText, InvUiText } from './InvText';
import { PhotoFrame } from './PhotoFrame';
import { FORMAT_SIZE, type Photo, type ThanksSimple } from '../types';
import { resolveThanks } from '../thanks';

/** 감사페이지 간단 모드 — a fixed layout: 제목 → 대표 사진 → 감사 문구 → 보내는 사람. */
export function SimpleThanksView({ simple, photo }: { simple: ThanksSimple; photo: Photo | undefined }) {
  const { project, theme, mode } = useCanvas();
  const { title, message, sender } = resolveThanks(project, simple);
  return (
    <View style={[styles.paper, { backgroundColor: theme.paper }]}>
      {title ? (
        <InvText size={FORMAT_SIZE.h1} bold leading={1.35} style={styles.center}>
          {title}
        </InvText>
      ) : null}
      {photo ? (
        <PhotoFrame photo={photo} aspect={4 / 5} radius={2} />
      ) : mode === 'edit' ? (
        <View style={[styles.noPhoto, { borderColor: theme.rule }]}>
          <InvUiText size={13} soft style={styles.center}>
            {'대표 사진이 없어요\n초대장에 사진을 넣으면 여기에 보여요'}
          </InvUiText>
        </View>
      ) : null}
      {message ? (
        <InvText size={FORMAT_SIZE.b1} leading={1.85} style={styles.center}>
          {message}
        </InvText>
      ) : null}
      {sender ? (
        <InvText size={FORMAT_SIZE.b2} soft style={styles.center}>
          {sender}
        </InvText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingVertical: 36,
    gap: 22,
  },
  center: {
    textAlign: 'center',
  },
  noPhoto: {
    aspectRatio: 4 / 5,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
