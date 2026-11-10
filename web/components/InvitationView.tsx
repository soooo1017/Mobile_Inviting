'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './invitation.css';
import { Page, PhotoFrame } from './blocks';
import { GuestContext, Txt, copyText, store, storeSet, useToast, visitorId, type GuestCtx } from './guest';
import { GuestbookSheet, RsvpSheet } from './forms';
import { themeFromMeta } from '../lib/color';
import { PRETENDARD_CSS, googleFontUrls } from '../lib/fonts';
import { bgmEditNotes, bgmTrackById, bgmUrl } from '../lib/bgm';
import { guestSides, kstDateKey, popupActive, resolveThanks } from '../lib/format';
import { DEFAULT_POPUP_START_DAYS, FORMAT_SIZE, type Bgm, type Block, type BlockOfType, type FontId, type Photo } from '../lib/model';
import type { LiveInvitation } from '../lib/invitation';
import { rpc } from '../lib/supabase';

type Props = { slug: string; inv: LiveInvitation; nowIso: string; view: 'invite' | 'thanks' };

/** 대표 사진 — 초대장 사진 중 골라 둔 것, 없으면 첫 사진 (앱의 coverPhoto와 같아요). 서버에 올라간 https 사진만. */
function coverPhoto(pages: { invite: Block[] }, coverId: string | undefined): Photo | undefined {
  const all: Photo[] = [];
  for (const b of pages.invite) {
    if (b.type === 'image' && b.props.photo) all.push(b.props.photo);
    if (b.type === 'gallery') all.push(...b.props.photos);
  }
  const ok = all.filter((p) => p && /^https:\/\//i.test(p.uri) && p.width > 0 && p.height > 0);
  return ok.find((p) => p.id === coverId) ?? ok[0];
}

export default function InvitationView({ slug, inv, nowIso, view }: Props) {
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const content = inv.content;
  const pages = useMemo(() => ({ invite: content?.pages?.invite ?? [], popup: content?.pages?.popup ?? [], thanks: content?.pages?.thanks ?? [] }), [content]);
  const meta = inv.public_meta;
  const theme = useMemo(() => themeFromMeta(meta?.colors, meta?.themeId), [meta]);
  const defaultFont: FontId = content?.font ?? 'pretendard';
  const sides = useMemo(() => guestSides(inv.event_type), [inv.event_type]);
  const { message: toastMessage, toast } = useToast();
  const [rsvp, setRsvp] = useState<BlockOfType<'rsvp'> | null>(null);
  const [gb, setGb] = useState<BlockOfType<'guestbook'> | null>(null);
  const [gbVersion, setGbVersion] = useState(0);

  const ctx: GuestCtx = {
    slug,
    title: inv.title,
    eventAt: inv.event_at,
    eventType: inv.event_type,
    now,
    theme,
    defaultFont,
    venue: meta?.venue ?? null,
    sides,
    toast,
    copy: (text, message) => {
      void copyText(text).then((ok) => toast(ok ? message : '복사하지 못했어요'));
    },
    openRsvp: setRsvp,
    openGuestbook: setGb,
    guestbookVersion: gbVersion,
  };

  // 방문 기록(개인정보 없는 익명 숫자) — 이 페이지를 열 때 한 번.
  const counted = useRef(false);
  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    void rpc('record_visit', { p_slug: slug, p_visitor: visitorId() });
  }, [slug]);

  // 안내 팝업: 초대장에서만, 내용이 있고, 시작일이 됐고, 오늘 하루 보지 않기를 안 눌렀을 때.
  const popupBlocks = pages.popup;
  const popupWanted =
    view === 'invite' &&
    !!content?.popup?.enabled &&
    popupBlocks.length > 0 &&
    popupActive(inv.event_at, content.popup.startDays === undefined ? DEFAULT_POPUP_START_DAYS : content.popup.startDays, now);
  const [popup, setPopup] = useState<'pending' | 'open' | 'closed'>('pending');
  const hideKey = `moiso.popup.${slug}`;
  useEffect(() => {
    setPopup(popupWanted && store(hideKey) !== kstDateKey(now) ? 'open' : 'closed');
  }, [popupWanted, hideKey, now]);
  const closePopup = useCallback(
    (hideToday: boolean) => {
      if (hideToday) storeSet(hideKey, kstDateKey(now));
      setPopup('closed');
    },
    [hideKey, now],
  );

  // 참석 응답 "초대장 열면 응답 창 먼저 띄우기" — 안내 팝업이 있으면 그걸 닫은 뒤에, 이미 응답한 기기에서는 다시 띄우지 않아요.
  const autoRsvp = view === 'invite' ? (pages.invite.find((b) => b.type === 'rsvp' && b.props.autoOpen) as BlockOfType<'rsvp'> | undefined) : undefined;
  const autoDone = useRef(false);
  useEffect(() => {
    if (!autoRsvp || popup !== 'closed' || autoDone.current) return;
    autoDone.current = true;
    if (!store(`moiso.rsvp.${slug}`)) setRsvp(autoRsvp);
  }, [autoRsvp, popup, slug]);

  const fontIds = useMemo(() => {
    const ids = new Set<FontId>([defaultFont]);
    for (const list of [pages.invite, pages.popup, pages.thanks]) for (const b of list) if (b.style?.font) ids.add(b.style.font);
    return ids;
  }, [defaultFont, pages]);

  const root = {
    ['--paper' as string]: theme.paper,
    ['--ink' as string]: theme.ink,
    ['--ink-soft' as string]: theme.inkSoft,
    ['--rule' as string]: theme.rule,
    ['--band' as string]: theme.band,
    ['--band-ink' as string]: theme.bandInk,
    ['--accent' as string]: theme.accent,
    ['--on-accent' as string]: theme.onAccent,
    ['--accent-ink' as string]: theme.accentInk,
    ['--field' as string]: theme.field,
    colorScheme: theme.isDark ? 'dark' : 'light',
  } as React.CSSProperties;

  const bgm = view === 'invite' ? content?.bgm : undefined;
  const music = bgmUrl(bgm);
  const creditTrack = bgm?.mode === 'list' ? bgmTrackById(bgm.trackId) : undefined;
  const hosts = meta?.hosts ?? [];

  return (
    <GuestContext.Provider value={ctx}>
      <link rel="stylesheet" href={PRETENDARD_CSS} precedence="default" />
      {googleFontUrls(fontIds).map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}
      <div className="inv-root" style={root}>
        <div className="inv-col">
          {view === 'thanks' ? (
            content?.thanks?.mode === 'free' && pages.thanks.length ? (
              <Page blocks={pages.thanks} />
            ) : (
              <SimpleThanks eventType={inv.event_type} hosts={hosts} simple={content?.thanks?.simple ?? { showSender: true }} photo={coverPhoto(pages, content?.coverPhotoId)} />
            )
          ) : (
            <>
              <Page blocks={pages.invite} />
              {creditTrack ? <BgmCredit track={creditTrack} bgm={bgm} /> : null}
            </>
          )}
          {music ? <MusicButton url={music} bgm={bgm} /> : null}
        </div>

        {popup === 'open' ? <GuestPopup blocks={popupBlocks} onClose={closePopup} /> : null}
        {rsvp ? <RsvpSheet block={rsvp} onClose={() => setRsvp(null)} /> : null}
        {gb ? <GuestbookSheet block={gb} onClose={() => setGb(null)} onPosted={() => setGbVersion((v) => v + 1)} /> : null}
        {toastMessage ? (
          <div className="toast" role="status">
            {toastMessage}
          </div>
        ) : null}
      </div>
    </GuestContext.Provider>
  );
}

// ── 안내 팝업 ────────────────────────────────────────────────────────────────

function GuestPopup({ blocks, onClose }: { blocks: Block[]; onClose: (hideToday: boolean) => void }) {
  const [hide, setHide] = useState(false);
  const close = () => onClose(hide);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(hide);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [hide, onClose]);
  return (
    <div className="popup-wrap">
      <div className="popup-dim" onClick={close} />
      <div className="popup" role="dialog" aria-modal="true" aria-label="안내">
        <div className="popup-body">
          <Page blocks={blocks} variant="popup" />
        </div>
        <div className="popup-bar">
          <button className="check popup-check" onClick={() => setHide((v) => !v)} role="checkbox" aria-checked={hide}>
            <span className={`box${hide ? ' on' : ''}`}>{hide ? '✓' : ''}</span>
            <span>오늘 하루 보지 않기</span>
          </button>
          <button className="popup-close" onClick={close}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 감사페이지(간단) ─────────────────────────────────────────────────────────

function SimpleThanks({
  eventType,
  hosts,
  simple,
  photo,
}: {
  eventType: string;
  hosts: { label: string; name: string }[];
  simple: { title?: string; message?: string; showSender: boolean; sender?: string };
  photo: Photo | undefined;
}) {
  const { title, message, sender } = resolveThanks(eventType, hosts, simple);
  return (
    <div className="thanks">
      {title ? (
        <Txt size={FORMAT_SIZE.h1} bold leading={1.35} className="t-center">
          {title}
        </Txt>
      ) : null}
      {photo ? <PhotoFrame photo={photo} aspect={4 / 5} radius={2} /> : null}
      {message ? (
        <Txt size={FORMAT_SIZE.b1} leading={1.85} className="t-center pre">
          {message}
        </Txt>
      ) : null}
      {sender ? (
        <Txt size={FORMAT_SIZE.b2} soft className="t-center">
          {sender}
        </Txt>
      ) : null}
    </div>
  );
}

// ── 배경음악 ─────────────────────────────────────────────────────────────────

function BgmCredit({ track, bgm }: { track: NonNullable<ReturnType<typeof bgmTrackById>>; bgm: Bgm | undefined }) {
  const notes = track.license === 'CC BY' ? bgmEditNotes(bgm) : [];
  return (
    <div className="credit">
      <div className="credit-title">♪ 배경음악</div>
      <p className="credit-row">
        <b>제목 </b>
        {track.credit}
        {notes.length ? ` · ${notes.join(' · ')}` : ''}
      </p>
      <p className="credit-row">
        <b>연주 </b>
        {track.performer}
      </p>
      <p className="credit-row">
        <b>출처 </b>
        {'Musopen  '}
        <b>라이선스 </b>
        {track.license === 'CC BY' ? 'CC BY' : '퍼블릭 도메인'}
      </p>
    </div>
  );
}

/**
 * ♪ 버튼 — 소리가 나는 자동 재생은 브라우저(사파리 · 크롬)가 막아서, **하객이 화면을 처음 터치하는 순간** 음악이 시작돼요
 * (팝업 닫기 · 버튼 누르기 · 스크롤 후 탭 등 어디든 첫 터치). 직접 ♪를 눌러 끈 뒤에는 다시 자동으로 켜지 않아요.
 * 노래 편집에서 정한 구간만, 정한 속도로 반복해요. 재생 중에는 막대가 움직이는 모양으로 바뀌어서 소리가 나고 있다는 걸 알 수 있어요.
 */
function MusicButton({ url, bgm }: { url: string; bgm: Bgm | undefined }) {
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const userOff = useRef(false);
  const start = Math.max(0, bgm?.start ?? 0);
  const end = bgm?.end ?? null;
  const speed = bgm?.speed && bgm.speed > 0 ? bgm.speed : 1;

  const ensure = useCallback((): HTMLAudioElement => {
    let a = audio.current;
    if (a) return a;
    a = new Audio(url);
    a.preload = 'auto';
    const el = a;
    const rewind = () => {
      el.currentTime = start;
    };
    el.addEventListener('loadedmetadata', () => {
      el.defaultPlaybackRate = speed;
      el.playbackRate = speed;
      if (el.currentTime < start) rewind();
    });
    el.addEventListener('timeupdate', () => {
      if (end !== null && el.currentTime >= end) rewind();
    });
    el.addEventListener('ended', () => {
      rewind();
      void el.play().catch(() => setPlaying(false));
    });
    // 전화가 오는 등으로 브라우저가 멈추면 버튼 모양도 맞춰요.
    el.addEventListener('pause', () => setPlaying(false));
    el.addEventListener('playing', () => setPlaying(true));
    audio.current = el;
    return el;
  }, [url, start, end, speed]);

  const play = useCallback(async (): Promise<boolean> => {
    const a = ensure();
    a.defaultPlaybackRate = speed;
    a.playbackRate = speed;
    if (a.readyState >= 1 && (a.currentTime < start || (end !== null && a.currentTime >= end))) a.currentTime = start;
    try {
      await a.play();
      return true;
    } catch {
      return false;
    }
  }, [ensure, speed, start, end]);

  // 열자마자 한 번 시도(자동 재생을 허용하는 브라우저 · 컴퓨터에서는 바로 나와요) + 막히면 첫 터치에서 시작.
  useEffect(() => {
    let done = false;
    const cleanup = () => {
      for (const ev of ['pointerup', 'touchend', 'click', 'keydown']) window.removeEventListener(ev, onGesture, true);
    };
    async function onGesture(e: Event) {
      if (done || userOff.current) return;
      // ♪ 버튼을 직접 누른 건 버튼이 처리해요(여기서 켜면 곧바로 꺼져 버려요).
      if (e.target instanceof Element && e.target.closest('.music')) return;
      if (await play()) {
        done = true;
        cleanup();
      }
    }
    for (const ev of ['pointerup', 'touchend', 'click', 'keydown']) window.addEventListener(ev, onGesture, true);
    void play().then((ok) => {
      if (ok) {
        done = true;
        cleanup();
      }
    });
    return () => {
      done = true;
      cleanup();
      audio.current?.pause();
    };
  }, [play]);

  const toggle = async () => {
    if (playing) {
      userOff.current = true;
      audio.current?.pause();
      setPlaying(false);
      return;
    }
    userOff.current = false;
    if (await play()) setPlaying(true);
  };

  return (
    <div className="music-wrap">
      <button className={`music ${playing ? 'on' : 'off'}`} onClick={toggle} aria-label={playing ? '배경음악 끄기' : '배경음악 켜기'} aria-pressed={playing}>
        {playing ? (
          <span className="eq" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        ) : (
          <span className="note" aria-hidden="true">
            ♪
          </span>
        )}
      </button>
    </div>
  );
}
