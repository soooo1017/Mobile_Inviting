import type { FontId } from './model';

/** 초대장 글꼴 9가지 — 앱 mobile/src/editor/fonts.tsx 와 같은 목록. 웹에서는 필요한 것만 구글 폰트 / Pretendard 에서 불러와요. */
type FontMeta = {
  family: string;
  fallback: string;
  /** 굵게 보일 때의 두께 — 굵은 글꼴이 없는 글꼴은 400 그대로예요(앱과 같아요). */
  bold: number;
  /** 구글 폰트 css2 의 family 값 (Pretendard 는 따로). */
  google?: string;
};

const SANS = "-apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";
const SERIF = "'Nanum Myeongjo', 'Noto Serif KR', serif";

export const FONT_META: Record<FontId, FontMeta> = {
  pretendard: { family: 'Pretendard', fallback: SANS, bold: 600 },
  notoSansKr: { family: 'Noto Sans KR', fallback: SANS, bold: 700, google: 'Noto+Sans+KR:wght@400;700' },
  gowunDodum: { family: 'Gowun Dodum', fallback: SANS, bold: 400, google: 'Gowun+Dodum' },
  nanumMyeongjo: { family: 'Nanum Myeongjo', fallback: SERIF, bold: 700, google: 'Nanum+Myeongjo:wght@400;700' },
  notoSerifKr: { family: 'Noto Serif KR', fallback: SERIF, bold: 700, google: 'Noto+Serif+KR:wght@400;700' },
  nanumPen: { family: 'Nanum Pen Script', fallback: SANS, bold: 400, google: 'Nanum+Pen+Script' },
  hiMelody: { family: 'Hi Melody', fallback: SANS, bold: 400, google: 'Hi+Melody' },
  gaegu: { family: 'Gaegu', fallback: SANS, bold: 700, google: 'Gaegu:wght@400;700' },
  cormorant: { family: 'Cormorant Garamond', fallback: `'Nanum Myeongjo', serif`, bold: 600, google: 'Cormorant+Garamond:wght@400;600' },
};

export const PRETENDARD_CSS = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css';

export function fontMeta(id: FontId | undefined): FontMeta {
  return (id && FONT_META[id]) || FONT_META.pretendard;
}

export function fontStack(id: FontId | undefined): string {
  const m = fontMeta(id);
  return `'${m.family}', ${m.fallback}`;
}

/** 이 초대장이 쓰는 글꼴(기본 + 블록마다 고른 것)을 불러오는 구글 폰트 주소들. */
export function googleFontUrls(ids: Iterable<FontId>): string[] {
  const fam = new Set<string>();
  for (const id of ids) {
    const g = FONT_META[id]?.google;
    if (g) fam.add(g);
  }
  return Array.from(fam).map((f) => `https://fonts.googleapis.com/css2?family=${f}&display=swap`);
}
