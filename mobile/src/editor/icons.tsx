import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color: string };

export function CallIcon({ size = 12, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M4.2 1.8l2 2.6-1.2 1.6a8.6 8.6 0 004.9 4.9l1.6-1.2 2.6 2-1 1.9C8.5 13.9 2.1 7.5 2.3 2.8z"
        fill="none"
        stroke={color}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SmsIcon({ size = 12, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M2.5 3.5h11v7.5H7l-3 2.5V11H2.5z" fill="none" stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
    </Svg>
  );
}

export function MailIcon({ size = 12, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Rect x={2} y={3.5} width={12} height={9} rx={1.2} fill="none" stroke={color} strokeWidth={1.3} />
      <Path d="M2.5 4.5L8 8.8l5.5-4.3" fill="none" stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
    </Svg>
  );
}

export function CopyIcon({ size = 12, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Rect x={5} y={5} width={8.5} height={8.5} rx={1.5} fill="none" stroke={color} strokeWidth={1.3} />
      <Path d="M3 10.5V3.8C3 3.4 3.4 3 3.8 3h6.7" fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

export function CalendarIcon({ size = 13, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Rect x={2} y={3} width={12} height={11} rx={1.5} fill="none" stroke={color} strokeWidth={1.3} />
      <Path d="M2 6.5h12M5.5 1.8v2.4M10.5 1.8v2.4" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

export function SortIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M5 2.5v11M5 13.5l-2.5-2.5M5 13.5l2.5-2.5M11 13.5v-11M11 2.5L8.5 5M11 2.5L13.5 5"
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EyeIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8z" fill="none" stroke={color} strokeWidth={1.3} />
      <Circle cx={8} cy={8} r={2} fill="none" stroke={color} strokeWidth={1.3} />
    </Svg>
  );
}

export function GearIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={3} fill="none" stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PhotoIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={5} width={18} height={14} rx={2} fill="none" stroke={color} strokeWidth={1.6} />
      <Circle cx={9} cy={10} r={1.6} fill={color} />
      <Path d="M4 17l5-5 4 4 3-3 4 4" fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}
