import { useState } from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { Help } from './ui';
import { coverPhoto, invitePhotoGroups } from './photos';
import type { Invitation } from './types';

const COLUMNS = 3;
const GAP = 4;

/** 대표 사진 고르기 — every photo on the invite page; shared by ⚙ 전체 설정 and the simple 감사페이지 editor. */
export function CoverPicker({ invitation, onSelect }: { invitation: Invitation; onSelect: (photoId: string) => void }) {
  const [width, setWidth] = useState(0);
  const groups = invitePhotoGroups(invitation);
  const current = coverPhoto(invitation);
  // Cells are sized from the measured width — 1/3 percentages wrap early on iOS.
  const cell = width > 0 ? Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS) : 0;

  if (!groups.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>초대장에 사진이 아직 없어요</Text>
        <Text style={styles.emptyDesc}>{'이미지나 갤러리로 사진을 넣으면\n여기서 대표 사진을 고를 수 있어요.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {groups.map((g) => (
        <View key={g.key} style={styles.group}>
          <Text style={styles.source}>{g.label}</Text>
          <View style={styles.grid}>
            {cell > 0
              ? g.photos.map((p) => {
                  const on = p.id === current?.id;
                  return (
                    <Pressable key={p.id} onPress={() => onSelect(p.id)} style={[styles.cell, { width: cell, height: cell }]} accessibilityState={{ selected: on }}>
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
      <Help>감사페이지(간단)와 공유할 때 보이는 사진에 쓰여요. 고르지 않으면 초대장의 첫 사진이 쓰여요.</Help>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space[6],
  },
  group: {
    gap: space[3],
  },
  source: {
    ...textStyle({ size: 'small', weight: 'medium', color: color.ink.muted }),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  cell: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: color.line.soft,
  },
  img: {
    width: '100%',
    height: '100%',
  },
  onFrame: {
    ...StyleSheet.absoluteFill,
    borderWidth: 3,
    borderColor: color.select.fill,
    borderRadius: 6,
    alignItems: 'flex-end',
    padding: 4,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: color.select.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Pretendard-SemiBold',
  },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.line.dashed,
    borderRadius: radius.card,
    paddingVertical: space[10],
    paddingHorizontal: space[6],
    alignItems: 'center',
    gap: space[3],
  },
  emptyTitle: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }),
  },
  emptyDesc: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    textAlign: 'center',
  },
});
