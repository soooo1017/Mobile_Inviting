import { useState } from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import type { PhotoGroup } from './photos';
import type { Photo } from './types';

const COLUMNS = 4;
const GAP = 4;

/** 초대장에 쓴 사진들 중에서 한 장 고르기 (안내 팝업 · 감사페이지 이미지). 같은 파일이면 골라진 것으로 보여요. */
export function PhotoChoiceGrid({
  groups,
  selectedUri,
  onSelect,
  extra,
  onAdd,
}: {
  groups: PhotoGroup[];
  selectedUri?: string;
  onSelect: (photo: Photo) => void;
  /** 앨범에서 따로 추가한 사진 — 초대장 사진들 뒤, + 앞에 보여요. */
  extra?: Photo;
  /** 마지막 + 칸을 눌렀을 때 (폰 앨범에서 다른 사진 추가). 없으면 + 칸을 안 그려요. */
  onAdd?: () => void;
}) {
  const [width, setWidth] = useState(0);
  // 칸 크기는 잰 너비로 계산해요 (퍼센트 너비는 iOS에서 마지막 칸이 일찍 줄바꿈돼요).
  const cell = width > 0 ? Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS) : 0;
  return (
    <View style={styles.wrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {groups.map((g) => (
        <View key={g.key} style={styles.group}>
          <Text style={styles.source}>{g.label}</Text>
          <View style={styles.grid}>
            {cell > 0
              ? g.photos.map((p) => {
                  const on = p.uri === selectedUri;
                  return (
                    <Pressable key={p.id} onPress={() => onSelect(p)} style={[styles.cell, { width: cell, height: cell }]} accessibilityState={{ selected: on }}>
                      <Image source={{ uri: p.uri }} style={styles.img} />
                      {on ? (
                        <View style={styles.onFrame}>
                          <View style={styles.check}>
                            <Text style={styles.checkMark}>✓</Text>
                          </View>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })
              : null}
          </View>
        </View>
      ))}
      {onAdd && cell > 0 ? (
        <View style={styles.grid}>
          {extra ? (
            <Pressable onPress={() => onSelect(extra)} style={[styles.cell, { width: cell, height: cell }]} accessibilityState={{ selected: extra.uri === selectedUri }}>
              <Image source={{ uri: extra.uri }} style={styles.img} />
              {extra.uri === selectedUri ? (
                <View style={styles.onFrame}>
                  <View style={styles.check}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                </View>
              ) : null}
            </Pressable>
          ) : null}
          <Pressable onPress={onAdd} style={[styles.cell, styles.addCell, { width: cell, height: cell }]} accessibilityLabel="사진 추가">
            <Text style={styles.addMark}>+</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[6] },
  group: { gap: space[3] },
  source: { ...textStyle({ size: 'small', weight: 'medium', color: color.ink.muted }) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  cell: { borderRadius: 6, overflow: 'hidden', backgroundColor: color.line.soft },
  img: { width: '100%', height: '100%' },
  addCell: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: color.accent.tintBorder, backgroundColor: color.accent.tintSoft },
  addMark: { ...textStyle({ size: 'title1', weight: 'regular', color: color.accent.base }) },
  onFrame: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 2, borderColor: color.accent.base, borderRadius: 6, alignItems: 'flex-end', padding: 4 },
  check: { width: 18, height: 18, borderRadius: 9, backgroundColor: color.accent.base, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
});
