import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyDesign, type PosterDesign } from './model';

const PREFIX = 'poster:v1:';
const SAVE_DELAY_MS = 400;

/** 홍보물 설정을 초대장마다 폰에 기억해요 (템플릿 · 멘트 · 체크 · 위치 · 색). */
export function usePosterDesign(projectId: string) {
  const [design, setDesignState] = useState<PosterDesign | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(PREFIX + projectId)
      .then((raw) => {
        if (!alive) return;
        let next = emptyDesign();
        if (raw) {
          try {
            next = { ...next, ...(JSON.parse(raw) as PosterDesign) };
          } catch {
            // 망가진 저장값은 무시하고 기본값으로 시작해요.
          }
        }
        setDesignState(next);
      })
      .catch(() => alive && setDesignState(emptyDesign()));
    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [projectId]);

  const setDesign = useCallback(
    (update: PosterDesign | ((d: PosterDesign) => PosterDesign)) => {
      setDesignState((prev) => {
        if (!prev) return prev;
        const next = typeof update === 'function' ? update(prev) : update;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          AsyncStorage.setItem(PREFIX + projectId, JSON.stringify(next)).catch(() => {});
        }, SAVE_DELAY_MS);
        return next;
      });
    },
    [projectId],
  );

  return { design, setDesign };
}
