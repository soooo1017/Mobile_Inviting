import Svg, { Path, Rect } from 'react-native-svg';

type Props = {
  size?: number;
  color: string;
};

/** 상세 보기 — 썸네일 + 텍스트 줄이 있는 카드 2개. */
export function DetailViewIcon({ size = 19, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={4} width={6.5} height={6.5} rx={1.3} stroke={color} strokeWidth={1.7} />
      <Path d="M12 5.8h8.5M12 9h5.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Rect x={3.5} y={13.5} width={6.5} height={6.5} rx={1.3} stroke={color} strokeWidth={1.7} />
      <Path d="M12 15.3h8.5M12 18.5h5.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

/** 앨범(썸네일) 보기 — 2x2 격자. */
export function ThumbViewIcon({ size = 19, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={3.5} width={7.5} height={7.5} rx={1.4} stroke={color} strokeWidth={1.7} />
      <Rect x={13} y={3.5} width={7.5} height={7.5} rx={1.4} stroke={color} strokeWidth={1.7} />
      <Rect x={3.5} y={13} width={7.5} height={7.5} rx={1.4} stroke={color} strokeWidth={1.7} />
      <Rect x={13} y={13} width={7.5} height={7.5} rx={1.4} stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

/** 리스트 보기 — 한 줄짜리 행 3개. */
export function ListViewIcon({ size = 19, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6.5h16M4 12h16M4 17.5h16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
