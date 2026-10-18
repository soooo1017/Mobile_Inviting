import { createContext, useContext } from 'react';
import type { Project } from '../../types/project';
import type { InvitationTheme } from '../invitationTheme';
import type { FontId } from '../types';

export type CanvasMode = 'edit' | 'preview';

export type CanvasContextValue = {
  project: Project;
  theme: InvitationTheme;
  defaultFont: FontId;
  /** 'edit': taps open edit sheets, guest actions are inert. 'preview': guest actions work (전화, 복사, 펼치기…). */
  mode: CanvasMode;
  /** Dark "되돌리기"-style toast (복사 안내 etc.). */
  showToast: (message: string) => void;
};

export const CanvasContext = createContext<CanvasContextValue | null>(null);

export function useCanvas() {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error('useCanvas must be used inside a canvas');
  return ctx;
}
