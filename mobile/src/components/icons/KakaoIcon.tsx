import Svg, { Path } from 'react-native-svg';
import { color } from '../../theme/tokens';

type Props = {
  size?: number;
};

// Placeholder mark for the Kakao social button — the handoff spec calls for
// swapping this out for Kakao's official login button asset before ship.
export function KakaoIcon({ size = 15 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 3C6.48 3 2 6.48 2 10.78c0 2.75 1.86 5.17 4.66 6.55-.2.75-.74 2.73-.85 3.15-.13.53.2.52.42.38.17-.11 2.7-1.83 3.8-2.58.63.09 1.28.14 1.97.14 5.52 0 10-3.48 10-7.64C22 6.48 17.52 3 12 3z"
        fill={color.brand.kakaoInk}
      />
    </Svg>
  );
}
