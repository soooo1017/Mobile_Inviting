// 앱 mobile/src/editor/icons.tsx 의 아이콘을 웹용으로 옮긴 것.
const PIN = 'M8 1.2c-2.9 0-5.1 2.2-5.1 5 0 3.6 5.1 8.6 5.1 8.6s5.1-5 5.1-8.6c0-2.8-2.2-5-5.1-5z';

type P = { size?: number; color?: string };
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 16 16', 'aria-hidden': true as const });

export function CallIcon({ size = 12, color = 'currentColor' }: P) {
  return (
    <svg {...base(size)}>
      <path d="M4.2 1.8l2 2.6-1.2 1.6a8.6 8.6 0 004.9 4.9l1.6-1.2 2.6 2-1 1.9C8.5 13.9 2.1 7.5 2.3 2.8z" fill="none" stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
    </svg>
  );
}
export function SmsIcon({ size = 12, color = 'currentColor' }: P) {
  return (
    <svg {...base(size)}>
      <path d="M2.5 3.5h11v7.5H7l-3 2.5V11H2.5z" fill="none" stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
    </svg>
  );
}
export function MailIcon({ size = 12, color = 'currentColor' }: P) {
  return (
    <svg {...base(size)}>
      <rect x={2} y={3.5} width={12} height={9} rx={1.2} fill="none" stroke={color} strokeWidth={1.3} />
      <path d="M2.5 4.5L8 8.8l5.5-4.3" fill="none" stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
    </svg>
  );
}
export function CopyIcon({ size = 12, color = 'currentColor' }: P) {
  return (
    <svg {...base(size)}>
      <rect x={5} y={5} width={8.5} height={8.5} rx={1.5} fill="none" stroke={color} strokeWidth={1.3} />
      <path d="M3 10.5V3.8C3 3.4 3.4 3 3.8 3h6.7" fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </svg>
  );
}
export function CalendarIcon({ size = 13, color = 'currentColor' }: P) {
  return (
    <svg {...base(size)}>
      <rect x={2} y={3} width={12} height={11} rx={1.5} fill="none" stroke={color} strokeWidth={1.3} />
      <path d="M2 6.5h12M5.5 1.8v2.4M10.5 1.8v2.4" stroke={color} strokeWidth={1.3} strokeLinecap="round" fill="none" />
    </svg>
  );
}
export function ExpandIcon({ size = 14, color = '#fff' }: P) {
  return (
    <svg {...base(size)}>
      <path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5L9 7M2.5 13.5L7 9" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function NaverMapIcon({ size = 14 }: { size?: number }) {
  return (
    <svg {...base(size)}>
      <path d={PIN} fill="#03c75a" />
      <path d="M6 3.9h1.3l1.6 2.4V3.9h1.2v4.6H8.8L7.2 6.1v2.4H6z" fill="#ffffff" />
    </svg>
  );
}
export function KakaoMapIcon({ size = 14 }: { size?: number }) {
  return (
    <svg {...base(size)}>
      <path d={PIN} fill="#fee500" stroke="#e0c800" strokeWidth={0.6} />
      <circle cx={8} cy={6.2} r={2} fill="#3c1e1e" />
    </svg>
  );
}
