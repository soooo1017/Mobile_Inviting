import { View } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { color } from '../theme/tokens';
import type { BgmLicense } from './bgm';

/** 노래 편집 화면 전용 보조 색 — 포인트 보라(accent)는 theme/tokens.ts를 따라가요. */
export const BGM = {
  accent: color.accent.base,
  tint: color.accent.tint,
  panel: '#f6f3ff',
  strip: '#efebfa',
  barOff: '#cfc7e6',
  segment: '#ebe5ff',
  playhead: '#e5463d',
  chipBorder: '#e1daf3',
} as const;

type IconProps = { size?: number; color?: string };

export function PlayIcon({ size = 18, color: c = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 4.5v15l13-7.5z" fill={c} />
    </Svg>
  );
}

export function PauseIcon({ size = 18, color: c = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={5} y={4} width={5} height={16} rx={1} fill={c} />
      <Rect x={14} y={4} width={5} height={16} rx={1} fill={c} />
    </Svg>
  );
}

/** 시작: 왼쪽 끝 선 쪽으로 향하는 화살표 (|←). */
export function StartIcon({ size = 18, color: c = BGM.accent }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 4v16" />
      <Path d="M20 12H8" />
      <Path d="M12 7.5L7.5 12 12 16.5" />
    </Svg>
  );
}

/** 끝: 오른쪽 끝 선 쪽으로 향하는 화살표 (→|). */
export function EndIcon({ size = 18, color: c = BGM.accent }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 4v16" />
      <Path d="M4 12h12" />
      <Path d="M12 7.5l4.5 4.5-4.5 4.5" />
    </Svg>
  );
}

export function EditIcon({ size = 16, color: c = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <Circle cx={16} cy={7} r={2} />
      <Circle cx={8} cy={17} r={2} />
    </Svg>
  );
}

export function WaveGlyph({ size = 30, color: c = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M3 10v4M6.5 6v12M10 8.5v7M13.5 4v16M17 8v8M20.5 10.5v3" />
    </Svg>
  );
}

/** Musopen 목록처럼 라이선스 아이콘만 보여줘요: CC BY = cc + 사람(BY) · 퍼블릭 도메인 = cc + PD. */
export function LicenseIcons({ license, size = 26 }: { license: BgmLicense; size?: number }) {
  const ink = color.ink.primary;
  return (
    <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel={license === 'CC BY' ? 'CC BY' : '퍼블릭 도메인'}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={10.5} fill="none" stroke={ink} strokeWidth={1.6} />
        <SvgText x={12} y={15.6} textAnchor="middle" fontSize={9.5} fontWeight="bold" fill={ink}>
          cc
        </SvgText>
      </Svg>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={10.5} fill="none" stroke={ink} strokeWidth={1.6} />
        {license === 'CC BY' ? (
          <>
            <Circle cx={12} cy={7.6} r={1.8} fill={ink} />
            <Path d="M9.2 10.4h5.6v4.4h-1.5v3.6h-2.6v-3.6H9.2z" fill={ink} />
          </>
        ) : (
          <SvgText x={12} y={15} textAnchor="middle" fontSize={8.2} fontWeight="bold" fill={ink}>
            PD
          </SvgText>
        )}
      </Svg>
    </View>
  );
}
