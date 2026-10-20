/* eslint-disable react-hooks/refs -- PanResponder callbacks only read refs inside gesture events, never during render; the rule can't tell them apart from render code. */
import { useEffect, useRef, useState } from 'react';
import { PanResponder, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { hexToHsv, hsvToHex, type Hsv } from '../editor/colors';

const AREA_H = 150;
const BAR_H = 22;
const RAINBOW = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000'] as const;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * In-app color picker — 색상(가로) · 채도(세로) area plus a 밝기 bar. It looks the same on
 * iPhone and Android (Android has no system color picker) and runs in Expo Go.
 */
export function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value));
  const [emitted, setEmitted] = useState(value.toLowerCase());
  const [areaW, setAreaW] = useState(0);
  const [barW, setBarW] = useState(0);

  // A color typed in the 색 코드 field moves the knobs; the picker's own changes don't loop back.
  if (value.toLowerCase() !== emitted) {
    setEmitted(value.toLowerCase());
    setHsv(hexToHsv(value));
  }

  const live = useRef({ hsv, areaW, barW, onChange });
  useEffect(() => {
    live.current = { hsv, areaW, barW, onChange };
  });

  const apply = (next: Hsv) => {
    live.current.hsv = next;
    setHsv(next);
    const hex = hsvToHex(next);
    setEmitted(hex);
    live.current.onChange(hex);
  };

  const [areaResponder] = useState(() => {
    const move = (x: number, y: number) => {
      const { hsv: cur, areaW: w } = live.current;
      if (!w) return;
      apply({ ...cur, h: clamp01(x / w) * 360, s: 1 - clamp01(y / AREA_H) });
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => move(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderMove: (e) => move(e.nativeEvent.locationX, e.nativeEvent.locationY),
    });
  });
  const [barResponder] = useState(() => {
    const move = (x: number) => {
      const { hsv: cur, barW: w } = live.current;
      if (!w) return;
      apply({ ...cur, v: clamp01(x / w) });
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => move(e.nativeEvent.locationX),
      onPanResponderMove: (e) => move(e.nativeEvent.locationX),
    });
  });

  const current = hsvToHex(hsv);
  return (
    <View style={styles.wrap}>
      <View style={styles.area} onLayout={(e) => setAreaW(e.nativeEvent.layout.width)} {...areaResponder.panHandlers}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip]}>
          <LinearGradient colors={RAINBOW} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['rgba(255,255,255,0)', '#ffffff']} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: 1 - hsv.v }]} />
        </View>
        <View pointerEvents="none" style={[styles.knob, { left: (hsv.h / 360) * areaW, top: (1 - hsv.s) * AREA_H, backgroundColor: current }]} />
      </View>
      <View style={styles.bar} onLayout={(e) => setBarW(e.nativeEvent.layout.width)} {...barResponder.panHandlers}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip, { borderRadius: BAR_H / 2 }]}>
          <LinearGradient colors={['#000000', hsvToHex({ ...hsv, v: 1 })]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </View>
        <View pointerEvents="none" style={[styles.knob, { left: hsv.v * barW, top: BAR_H / 2, backgroundColor: current }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
  },
  area: {
    height: AREA_H,
  },
  bar: {
    height: BAR_H,
  },
  clip: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  knob: {
    position: 'absolute',
    width: 22,
    height: 22,
    marginLeft: -11,
    marginTop: -11,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
});
