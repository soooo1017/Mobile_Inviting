import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { pickPhotos } from '../editor/sheets/BasicSheets';
import { invitePhotoGroups } from '../editor/photos';
import type { Invitation, Photo } from '../editor/types';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  invitation: Invitation;
  /** 지금 홍보물에 쓰는 사진. */
  current?: Photo;
  /** 지금 사진의 틀 안 위치를 다시 맞춰요. */
  onAdjust: () => void;
  onPick: (photo: Photo) => void;
};

/** [사진 변경] — 지금 사진(위치 다시 맞추기) · 초대장에 넣은 사진 · 앨범. */
export function PhotoChangeSheet({ visible, onClose, invitation, current, onAdjust, onPick }: Props) {
  const { width } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const cell = Math.floor((width - space.screenX * 2 - space[3] * 2) / 3);
  const photos = invitePhotoGroups(invitation).flatMap((g) => g.photos);

  const album = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const [picked] = await pickPhotos(1);
      if (picked) onPick(picked);
    } catch {
      Alert.alert('사진을 불러오지 못했어요', '사진 접근 권한을 확인해주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="사진 변경" maxHeight="82%">
      <ScrollView contentContainerStyle={styles.body}>
        {current ? (
          <Pressable onPress={onAdjust} style={styles.currentRow}>
            <Image source={{ uri: current.uri }} style={styles.currentThumb} />
            <View style={styles.flex}>
              <View style={styles.titleRow}>
                <Text style={styles.rowTitle}>지금 사진</Text>
                <Text style={styles.chip}>사용 중</Text>
              </View>
              <Text style={styles.rowSub}>눌러서 위치 · 확대를 다시 맞춰요</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ) : null}

        {photos.length ? (
          <View style={styles.section}>
            <Text style={styles.label}>초대장에 넣은 사진</Text>
            <View style={styles.grid}>
              {photos.map((p) => (
                <Pressable key={p.id} onPress={() => onPick(p)} style={[styles.cell, { width: cell, height: cell }, current?.id === p.id && styles.cellOn]}>
                  <Image source={{ uri: p.uri }} style={styles.cellImg} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <Pressable onPress={album} disabled={busy} style={styles.albumRow}>
          <Text style={styles.rowTitle}>앨범에서 고르기</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  body: { paddingHorizontal: space.screenX, paddingBottom: space[6], gap: space[6] },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.input,
    padding: space[4],
  },
  currentThumb: { width: 44, height: 44, borderRadius: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  rowTitle: { ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }) },
  rowSub: { ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }) },
  chip: {
    ...textStyle({ size: 'caption', weight: 'semibold', color: color.accent.base }),
    backgroundColor: color.accent.tint,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  chevron: { ...textStyle({ size: 'control', weight: 'regular', color: color.ink.placeholder }) },
  section: { gap: space[3] },
  label: { ...textStyle({ size: 'small', weight: 'semibold', color: color.ink.muted }) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  cell: { borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  cellOn: { borderColor: color.accent.base },
  cellImg: { width: '100%', height: '100%' },
  albumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.input,
    paddingHorizontal: space[5],
    paddingVertical: space[5],
  },
});
