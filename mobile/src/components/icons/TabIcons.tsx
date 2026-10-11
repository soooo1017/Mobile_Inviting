import Svg, { Path, Circle } from 'react-native-svg';

type Props = {
  size?: number;
  color: string;
  active?: boolean;
};

export function HomeTabIcon({ size = 23, color, active }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11.5 12 4l8 7.5"
        stroke={color}
        strokeWidth={active ? 2.1 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 10v8.5a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1V10"
        stroke={color}
        strokeWidth={active ? 2.1 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function InviteTabIcon({ size = 23, color, active }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 6h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"
        stroke={color}
        strokeWidth={active ? 2.1 : 1.8}
        strokeLinejoin="round"
      />
      <Path
        d="m4 7 8 6.5L20 7"
        stroke={color}
        strokeWidth={active ? 2.1 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ProfileTabIcon({ size = 23, color, active }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8.2} r={3.4} stroke={color} strokeWidth={active ? 2.1 : 1.8} />
      <Path
        d="M5 19.2c0-3.3 3.13-5.7 7-5.7s7 2.4 7 5.7"
        stroke={color}
        strokeWidth={active ? 2.1 : 1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
