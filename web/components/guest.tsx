'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';
import type { InvitationTheme } from '../lib/color';
import { fontMeta, fontStack } from '../lib/fonts';
import type { Block, FontId } from '../lib/model';
import type { Venue } from '../lib/format';

/** 초대장을 그리는 동안 모든 항목이 같이 쓰는 값 · 동작. */
export type GuestCtx = {
  slug: string;
  title: string;
  eventAt: string;
  eventType: string;
  now: Date;
  theme: InvitationTheme;
  defaultFont: FontId;
  venue: Venue;
  sides: [string, string] | [];
  toast: (message: string) => void;
  copy: (text: string, message: string) => void;
  openRsvp: (block: Extract<Block, { type: 'rsvp' }>) => void;
  openGuestbook: (block: Extract<Block, { type: 'guestbook' }>) => void;
  /** 방명록을 쓰면 올라가는 번호 — 목록이 이걸 보고 다시 읽어요. */
  guestbookVersion: number;
};

export const GuestContext = createContext<GuestCtx | null>(null);

export function useGuest(): GuestCtx {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error('GuestContext 밖에서 썼어요');
  return ctx;
}

/** 초대장 글꼴로 그려지는 글 (제목 · 본문 …). */
export function Txt({
  font,
  bold = false,
  size,
  leading = 1.6,
  soft = false,
  className,
  style,
  as: Tag = 'p',
  children,
}: {
  font?: FontId;
  bold?: boolean;
  size: number;
  leading?: number;
  soft?: boolean;
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
  children: ReactNode;
}) {
  const { defaultFont, theme } = useGuest();
  const id = font ?? defaultFont;
  return (
    <Tag
      className={className}
      style={{
        fontFamily: fontStack(id),
        fontWeight: bold ? fontMeta(id).bold : 400,
        fontSize: size,
        lineHeight: `${Math.round(size * leading)}px`,
        color: soft ? theme.inkSoft : theme.ink,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

/** 초대장 안의 숫자 · 주소 · 작은 글씨 — 항상 Pretendard. */
export function Ui({
  size,
  soft = false,
  bold = false,
  className,
  style,
  children,
}: {
  size: number;
  soft?: boolean;
  bold?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const { theme } = useGuest();
  return (
    <span className={className} style={{ fontFamily: fontStack('pretendard'), fontWeight: bold ? 600 : 400, fontSize: size, color: soft ? theme.inkSoft : theme.ink, ...style }}>
      {children}
    </span>
  );
}

/** 이 브라우저(기기)의 익명 번호 — 같은 사람이 다시 응답하면 덮어쓰고, 방문 수를 셀 때만 써요. 이름 · 연락처와 아무 관계가 없는 무작위 값이에요. */
let memoryVisitor: string | null = null;
export function visitorId(): string {
  const make = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });
  try {
    const saved = localStorage.getItem('moiso.visitor');
    if (saved && /^[0-9a-f-]{36}$/i.test(saved)) return saved;
    const id = make();
    localStorage.setItem('moiso.visitor', id);
    return id;
  } catch {
    memoryVisitor ??= make();
    return memoryVisitor;
  }
}

export function store(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function storeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 저장이 막혀 있어도 화면은 그대로 동작해요 */
  }
}

/** 어두운 안내 말풍선 (복사했어요 …). */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useCallback((m: string) => {
    setMessage(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2200);
  }, []);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  return { message, toast };
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 구형 브라우저 · http 에서는 눌러서 복사하는 방식으로.
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/** 아래에서 올라오는 창 — 바깥을 누르거나 ✕ · Esc 로 닫아요. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="sheet-wrap">
      <div className="sheet-dim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-grab" />
        <div className="sheet-head">
          <Txt as="h2" size={18} bold leading={1.3} style={{ margin: 0 }}>
            {title}
          </Txt>
          <button className="sheet-x" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
