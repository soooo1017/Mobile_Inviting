import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_COLORS, type EventType, type ThanksSettings, type ThemeColors, type Venue } from '../types/project';
import type { FontId } from '../editor/types';
import { eventTypeMeta } from '../types/project';

export type NewProjectDraft = {
  eventType: EventType;
  customTypeName: string;
  hosts: { label: string; name: string }[];
  eventAt: string;
  venue?: Venue;
  thanks: ThanksSettings;
  /** 배경 · 포인트 · 글씨 색. */
  colors: ThemeColors;
  /** 기본 글꼴, picked next to the theme on the last step. */
  font: FontId;
};

function initialDraft(): NewProjectDraft {
  const eventAt = new Date();
  eventAt.setDate(eventAt.getDate() + 30);
  eventAt.setHours(14, 0, 0, 0);
  return {
    eventType: 'wedding',
    customTypeName: '',
    hosts: eventTypeMeta('wedding').hostLabels.map((label) => ({ label, name: '' })),
    eventAt: eventAt.toISOString(),
    venue: undefined,
    thanks: { enabled: true, days: 7, hasContent: false },
    colors: DEFAULT_COLORS,
    font: 'pretendard',
  };
}

type DraftContextValue = {
  draft: NewProjectDraft;
  update: (patch: Partial<NewProjectDraft>) => void;
  reset: () => void;
};

const NewProjectDraftContext = createContext<DraftContextValue | null>(null);

export function NewProjectDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<NewProjectDraft>(initialDraft);

  const value = useMemo<DraftContextValue>(
    () => ({
      draft,
      update: (patch) => setDraft((prev) => ({ ...prev, ...patch })),
      reset: () => setDraft(initialDraft()),
    }),
    [draft],
  );

  return <NewProjectDraftContext.Provider value={value}>{children}</NewProjectDraftContext.Provider>;
}

export function useNewProjectDraft() {
  const ctx = useContext(NewProjectDraftContext);
  if (!ctx) {
    throw new Error('useNewProjectDraft must be used within a NewProjectDraftProvider');
  }
  return ctx;
}
