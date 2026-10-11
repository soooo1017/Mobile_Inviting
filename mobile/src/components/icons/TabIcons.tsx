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

export function PlusIcon({ size = 23, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.25} stroke={color} strokeWidth={1.8} />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
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
