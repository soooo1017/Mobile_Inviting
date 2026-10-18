import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as Font from 'expo-font';
import type { FontId } from './types';

// The 9 invitation fonts (EDITOR_PLAN §5). Pretendard ships with the app;
// the rest are loaded the first time an invitation or the font list needs
// them, so they're only downloaded when actually used.

type FontMeta = {
  id: FontId;
  label: string;
  /** Shown next to the name in the font list. */
  sub?: string;
  category: '고딕' | '명조' | '손글씨' | '영문';
  /** Cormorant has no Hangul glyphs, so it can only be picked per block. */
  canBeDefault: boolean;
  regular: string;
  bold: string;
};

export const FONTS: FontMeta[] = [
  { id: 'pretendard', label: 'Pretendard', sub: '프리텐다드', category: '고딕', canBeDefault: true, regular: 'Pretendard-Regular', bold: 'Pretendard-SemiBold' },
  { id: 'notoSansKr', label: 'Noto Sans KR', sub: '노토 산스', category: '고딕', canBeDefault: true, regular: 'NotoSansKR_400Regular', bold: 'NotoSansKR_700Bold' },
  { id: 'gowunDodum', label: '고운돋움', category: '고딕', canBeDefault: true, regular: 'GowunDodum_400Regular', bold: 'GowunDodum_400Regular' },
  { id: 'nanumMyeongjo', label: '나눔명조', category: '명조', canBeDefault: true, regular: 'NanumMyeongjo_400Regular', bold: 'NanumMyeongjo_700Bold' },
  { id: 'notoSerifKr', label: 'Noto Serif KR', sub: '노토 세리프', category: '명조', canBeDefault: true, regular: 'NotoSerifKR_400Regular', bold: 'NotoSerifKR_700Bold' },
  { id: 'nanumPen', label: '나눔손글씨 펜', category: '손글씨', canBeDefault: true, regular: 'NanumPenScript_400Regular', bold: 'NanumPenScript_400Regular' },
  { id: 'hiMelody', label: '하이멜로디', category: '손글씨', canBeDefault: true, regular: 'HiMelody_400Regular', bold: 'HiMelody_400Regular' },
  { id: 'gaegu', label: '개구', category: '손글씨', canBeDefault: true, regular: 'Gaegu_400Regular', bold: 'Gaegu_700Bold' },
  { id: 'cormorant', label: 'Cormorant Garamond', sub: '영문 전용', category: '영문', canBeDefault: false, regular: 'CormorantGaramond_400Regular', bold: 'CormorantGaramond_600SemiBold' },
];

export function fontMeta(id: FontId): FontMeta {
  return FONTS.find((f) => f.id === id) ?? FONTS[0];
}

// Static requires so Metro knows the files; loadAsync only fetches them on demand.
const SOURCES: Record<Exclude<FontId, 'pretendard'>, Record<string, number>> = {
  notoSansKr: {
    NotoSansKR_400Regular: require('@expo-google-fonts/noto-sans-kr/400Regular/NotoSansKR_400Regular.ttf'),
    NotoSansKR_700Bold: require('@expo-google-fonts/noto-sans-kr/700Bold/NotoSansKR_700Bold.ttf'),
  },
  gowunDodum: {
    GowunDodum_400Regular: require('@expo-google-fonts/gowun-dodum/400Regular/GowunDodum_400Regular.ttf'),
  },
  nanumMyeongjo: {
    NanumMyeongjo_400Regular: require('@expo-google-fonts/nanum-myeongjo/400Regular/NanumMyeongjo_400Regular.ttf'),
    NanumMyeongjo_700Bold: require('@expo-google-fonts/nanum-myeongjo/700Bold/NanumMyeongjo_700Bold.ttf'),
  },
  notoSerifKr: {
    NotoSerifKR_400Regular: require('@expo-google-fonts/noto-serif-kr/400Regular/NotoSerifKR_400Regular.ttf'),
    NotoSerifKR_700Bold: require('@expo-google-fonts/noto-serif-kr/700Bold/NotoSerifKR_700Bold.ttf'),
  },
  nanumPen: {
    NanumPenScript_400Regular: require('@expo-google-fonts/nanum-pen-script/400Regular/NanumPenScript_400Regular.ttf'),
  },
  hiMelody: {
    HiMelody_400Regular: require('@expo-google-fonts/hi-melody/400Regular/HiMelody_400Regular.ttf'),
  },
  gaegu: {
    Gaegu_400Regular: require('@expo-google-fonts/gaegu/400Regular/Gaegu_400Regular.ttf'),
    Gaegu_700Bold: require('@expo-google-fonts/gaegu/700Bold/Gaegu_700Bold.ttf'),
  },
  cormorant: {
    CormorantGaramond_400Regular: require('@expo-google-fonts/cormorant-garamond/400Regular/CormorantGaramond_400Regular.ttf'),
    CormorantGaramond_600SemiBold: require('@expo-google-fonts/cormorant-garamond/600SemiBold/CormorantGaramond_600SemiBold.ttf'),
  },
};

type FontsContextValue = {
  isLoaded: (id: FontId) => boolean;
  ensure: (ids: FontId[]) => void;
};

const FontsContext = createContext<FontsContextValue | null>(null);

export function InvitationFontsProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState<Set<FontId>>(() => new Set<FontId>(['pretendard']));
  const pending = useRef(new Set<FontId>());

  const ensure = useCallback((ids: FontId[]) => {
    for (const id of ids) {
      if (id === 'pretendard' || pending.current.has(id)) continue;
      pending.current.add(id);
      Font.loadAsync(SOURCES[id])
        .then(() => setLoaded((prev) => new Set(prev).add(id)))
        .catch((e) => {
          // Leave it pending-free so a later render can retry; text falls back meanwhile.
          pending.current.delete(id);
          console.warn(`font ${id} failed to load:`, e?.message ?? e);
        });
    }
  }, []);

  const value = useMemo<FontsContextValue>(() => ({ isLoaded: (id) => loaded.has(id), ensure }), [loaded, ensure]);
  return <FontsContext.Provider value={value}>{children}</FontsContext.Provider>;
}

export function useInvitationFonts() {
  const ctx = useContext(FontsContext);
  if (!ctx) throw new Error('useInvitationFonts must be used within InvitationFontsProvider');
  return ctx;
}

/** Font family for a block: falls back to Pretendard until the chosen font has finished loading. */
export function useFontFamily(id: FontId, bold: boolean): string {
  const { isLoaded, ensure } = useInvitationFonts();
  useEffect(() => {
    ensure([id]);
  }, [id, ensure]);
  const meta = isLoaded(id) ? fontMeta(id) : fontMeta('pretendard');
  return bold ? meta.bold : meta.regular;
}
