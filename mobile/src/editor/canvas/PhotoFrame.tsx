import { useState } from 'react';
import { Image, View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import type { Crop, ImageRatio, Photo } from '../types';

export const RATIO_VALUE: Record<Exclude<ImageRatio, 'original'>, number> = {
  '1:1': 1,
  '4:5': 4 / 5,
  '3:4': 3 / 4,
  '16:9': 16 / 9,
};

export function frameAspect(ratio: ImageRatio, photo?: Photo): number {
  if (ratio === 'original') return photo ? photo.width / photo.height : 4 / 5;
  return RATIO_VALUE[ratio];
}

/** Where the photo is drawn inside a W×H frame for a given crop (shared by the block and the 위치 조정 screen). */
export function photoRect(photo: Photo, frameW: number, frameH: number, crop: Crop) {
  const cover = Math.max(frameW / photo.width, frameH / photo.height) * Math.max(1, crop.scale);
  const w = photo.width * cover;
  const h = photo.height * cover;
  const maxX = (w - frameW) / 2;
  const maxY = (h - frameH) / 2;
  const dx = Math.max(-maxX, Math.min(maxX, crop.x * frameW));
  const dy = Math.max(-maxY, Math.min(maxY, crop.y * frameH));
  return { width: w, height: h, left: (frameW - w) / 2 + dx, top: (frameH - h) / 2 + dy };
}

type Props = {
  photo: Photo;
  aspect: number;
  crop?: Crop;
  radius?: number;
};

/** A photo filling a frame of the given aspect ratio, positioned by `crop`. */
export function PhotoFrame({ photo, aspect, crop = { x: 0, y: 0, scale: 1 }, radius = 0 }: Props) {
  const [width, setWidth] = useState(0);
  const height = width / aspect;
  return (
    <View
      style={[styles.frame, { aspectRatio: aspect, borderRadius: radius }]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 ? <Image source={{ uri: photo.uri }} style={[styles.img, photoRect(photo, width, height, crop)]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  img: {
    position: 'absolute',
  },
});
