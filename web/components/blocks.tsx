'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CalendarIcon, CallIcon, CopyIcon, ExpandIcon, KakaoMapIcon, MailIcon, NaverMapIcon, SmsIcon } from './icons';
import { Sheet, Txt, Ui, useGuest } from './guest';
import { fontStack } from '../lib/fonts';
import {
  buildIcs,
  formatDday,
  formatDeadline,
  formatWhen,
  isPastDeadline,
  isValidUrl,
  mapUrl,
  monthGrid,
  safeHttpUrl,
  shortBank,
  venueAddressLine,
  venueQuery,
  weekdayLabels,
} from '../lib/format';
import { EVENT_RED } from '../lib/color';
import { FORMAT_SIZE, GAP_HEIGHT, SPACER_HEIGHT, type Block, type BlockOfType, type Crop, type FontId, type Photo } from '../lib/model';
import { GuestbookList } from './forms';

// 앱의 mobile/src/editor/canvas/*.tsx(미리보기)와 같은 모양으로 그려요.

export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} />;
    case 'image':
      return <ImageBlock block={block} />;
    case 'gallery':
      return <GalleryBlock block={block} />;
    case 'divider':
      return <DividerBlock block={block} />;
    case 'spacer':
      return <div style={{ height: SPACER_HEIGHT[block.props.height] ?? SPACER_HEIGHT.m }} />;
    case 'button':
      return <ButtonBlock block={block} />;
    case 'phone':
      return <PhoneBlock block={block} />;
    case 'email':
      return <EmailBlock block={block} />;
    case 'map':
      return <MapBlock block={block} />;
    case 'datetime':
      return <DateTimeBlock block={block} />;
    case 'rsvp':
      return <RsvpBlock block={block} />;
    case 'guestbook':
      return <GuestbookBlock block={block} />;
    case 'account':
      return <AccountBlock block={block} />;
    default:
      return null;
  }
}

/** 페이지 하나(초대장 · 안내 팝업 · 감사페이지) — 항목 사이 간격은 앱 Canvas와 같아요. */
export function Page({ blocks, variant = 'page' }: { blocks: Block[]; variant?: 'page' | 'popup' }) {
  return (
    <div className={`inv-paper${variant === 'popup' ? ' in-popup' : ''}`}>
      {blocks.map((b) => (
        <div key={b.id} className="inv-slot">
          <div className="inv-block">
            <BlockView block={b} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 사진 ─────────────────────────────────────────────────────────────────────

const RATIO: Record<string, number> = { '1:1': 1, '4:5': 4 / 5, '3:4': 3 / 4, '16:9': 16 / 9 };
const NO_CROP: Crop = { x: 0, y: 0, scale: 1 };

/** 서버에 올라간 https 사진만 보여요(폰 안의 파일 주소는 하객이 열 수 없어요). */
function photoOk(p: Photo | undefined): p is Photo {
  return !!p && /^https:\/\//i.test(p.uri) && p.width > 0 && p.height > 0;
}

export function PhotoFrame({ photo, aspect, crop = NO_CROP, radius = 0 }: { photo: Photo; aspect: number; crop?: Crop; radius?: number }) {
  // 앱의 photoRect와 같은 계산 — 틀 너비를 1로 놓고 사진 위치 · 크기를 %로 바꿔요.
  const fw = 1;
  const fh = 1 / aspect;
  const cover = Math.max(fw / photo.width, fh / photo.height) * Math.max(1, crop.scale || 1);
  const w = photo.width * cover;
  const h = photo.height * cover;
  const dx = Math.max(-(w - fw) / 2, Math.min((w - fw) / 2, (crop.x || 0) * fw));
  const dy = Math.max(-(h - fh) / 2, Math.min((h - fh) / 2, (crop.y || 0) * fh));
  const style: CSSProperties = {
    width: `${(w / fw) * 100}%`,
    height: `${(h / fh) * 100}%`,
    left: `${(((fw - w) / 2 + dx) / fw) * 100}%`,
    top: `${(((fh - h) / 2 + dy) / fh) * 100}%`,
  };
  return (
    <div className="ph" style={{ aspectRatio: String(aspect), borderRadius: radius }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.uri} alt="" loading="lazy" decoding="async" draggable={false} style={style} />
    </div>
  );
}

function ImageBlock({ block }: { block: BlockOfType<'image'> }) {
  const { photo, ratio, crop } = block.props;
  if (!photoOk(photo)) return null;
  const aspect = ratio === 'original' ? photo.width / photo.height : (RATIO[ratio] ?? 4 / 5);
  return <PhotoFrame photo={photo} aspect={aspect} crop={ratio === 'original' ? undefined : crop} radius={2} />;
}

function GalleryBlock({ block }: { block: BlockOfType<'gallery'> }) {
  const { theme } = useGuest();
  const { layout, zoomOnTap } = block.props;
  const photos = block.props.photos.filter(photoOk);
  const [viewer, setViewer] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);
  if (!photos.length) return null;
  const open = zoomOnTap ? (i: number) => setViewer(i) : undefined;

  let body: ReactNode;
  if (layout === 'single') {
    body = (
      <div className="gal-col">
        {photos.map((p, i) => (
          <Tap key={p.id} onTap={open && (() => open(i))}>
            <PhotoFrame photo={p} aspect={p.width / p.height} radius={2} />
          </Tap>
        ))}
      </div>
    );
  } else if (layout === 'grid') {
    body = (
      <div className="gal-grid">
        {photos.map((p, i) => (
          <Tap key={p.id} onTap={open && (() => open(i))}>
            <PhotoFrame photo={p} aspect={1} radius={2} />
          </Tap>
        ))}
      </div>
    );
  } else {
    // 한 화면에 한 장. 밀어서 넘기거나, 사진의 오른쪽 절반을 누르면 다음 · 왼쪽 절반은 이전.
    const goTo = (i: number) => {
      const el = slideRef.current;
      if (!el) return;
      const next = Math.max(0, Math.min(photos.length - 1, i));
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
      setSlide(next);
    };
    body = (
      <div>
        <div
          className="gal-slide"
          ref={slideRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.clientWidth) setSlide(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {photos.map((p, i) => (
            <div
              key={p.id}
              className="gal-page"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                goTo(e.clientX - r.left < r.width / 2 ? i - 1 : i + 1);
              }}
            >
              <PhotoFrame photo={p} aspect={4 / 5} radius={2} />
              {open ? (
                <button
                  className="gal-expand"
                  aria-label="크게 보기"
                  onClick={(e) => {
                    e.stopPropagation();
                    open(i);
                  }}
                >
                  <ExpandIcon />
                </button>
              ) : null}
            </div>
          ))}
        </div>
        <div className="gal-dots" style={{ color: theme.inkSoft }}>
          {photos.slice(0, 8).map((p, i) => (
            <span key={p.id} className={`gal-dot${i === Math.min(slide, 7) ? ' on' : ''}`} />
          ))}
          <span className="gal-count">{`${slide + 1} / ${photos.length}`}</span>
        </div>
      </div>
    );
  }
  return (
    <>
      {body}
      {viewer !== null ? <PhotoViewer photos={photos} start={viewer} onClose={() => setViewer(null)} /> : null}
    </>
  );
}

function Tap({ onTap, children }: { onTap?: () => void; children: ReactNode }) {
  if (!onTap) return <div>{children}</div>;
  return (
    <button className="gal-tap" onClick={onTap} aria-label="크게 보기">
      {children}
    </button>
  );
}

function PhotoViewer({ photos, start, onClose }: { photos: Photo[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = track.current;
    if (el) el.scrollLeft = start * el.clientWidth;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [start, onClose]);
  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label="사진 크게 보기">
      <div className="viewer-track" ref={track} onScroll={(e) => e.currentTarget.clientWidth && setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
        {photos.map((p) => (
          <div key={p.id} className="viewer-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.uri} alt="" draggable={false} />
          </div>
        ))}
      </div>
      <div className="viewer-top">
        <span>{`${index + 1} / ${photos.length}`}</span>
        <button onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </div>
    </div>
  );
}

// ── 글 · 구분선 · 버튼 ───────────────────────────────────────────────────────

function TextBlock({ block }: { block: BlockOfType<'text'> }) {
  const { format, content } = block.props;
  if (!content?.trim()) return null;
  const heading = format === 'h1' || format === 'h2' || format === 'h3';
  return (
    <Txt font={block.style?.font} size={FORMAT_SIZE[format] ?? 16} bold={heading} leading={heading ? 1.35 : 1.7} soft={format === 'b2'} className="pre" style={{ textAlign: block.style?.align ?? 'center' }}>
      {content}
    </Txt>
  );
}

function DividerBlock({ block }: { block: BlockOfType<'divider'> }) {
  const width = block.props.length === 'short' ? '30%' : '72%';
  switch (block.props.shape) {
    case 'dots':
      return <div className="div-dots">· · ·</div>;
    case 'heart':
      return (
        <div className="div-heart" style={{ width }}>
          <i />
          <span>♥</span>
          <i />
        </div>
      );
    case 'dashed':
      return <div className="div-dash" style={{ width }} />;
    default:
      return <div className="div-line" style={{ width }} />;
  }
}

/** 초대장 안의 버튼 — 링크 · 전화 · 복사 …가 모두 이 모양이에요. */
export function InvButton({
  label,
  tone,
  hug,
  icon,
  href,
  external,
  onClick,
  disabled,
}: {
  label: string;
  tone: 'fill' | 'outline';
  hug?: boolean;
  icon?: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const cls = `ibtn ${tone}${hug ? ' hug' : ''}`;
  const inner = (
    <>
      {icon}
      <span>{label}</span>
    </>
  );
  if (href && !disabled) {
    return (
      <a className={cls} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {inner}
      </a>
    );
  }
  return (
    <button className={cls} onClick={onClick} disabled={disabled || !onClick} style={{ fontFamily: fontStack('pretendard') }}>
      {inner}
    </button>
  );
}

function ButtonBlock({ block }: { block: BlockOfType<'button'> }) {
  const { label, url, shape, width } = block.props;
  if (!label?.trim()) return null;
  const href = isValidUrl(url ?? '') ? (safeHttpUrl(url) ?? undefined) : undefined;
  const btn = <InvButton label={label.trim()} tone={shape === 'fill' ? 'fill' : 'outline'} hug={width === 'hug'} href={href} external />;
  return width === 'hug' ? <div className="hug-wrap">{btn}</div> : btn;
}

// ── 연락처 · 이메일 · 계좌 ───────────────────────────────────────────────────

type Row = { key: string; role: string; name: string; detail?: string; actions?: ReactNode };

function RowList({ rows, font, lines, closingLine = true }: { rows: Row[]; font?: FontId; lines: boolean; closingLine?: boolean }) {
  return (
    <div className="rows">
      {rows.map((r, i) => {
        const showLine = lines && (i < rows.length - 1 || closingLine);
        return (
          <div key={r.key} className={`row${showLine ? ' line' : ''}`}>
            <Ui size={11.5} soft className="row-role">
              {r.role}
            </Ui>
            <div className="row-main">
              <Txt font={font} size={15} bold leading={1.4} className="row-name">
                {r.name}
              </Txt>
              {r.detail ? <Ui size={12.5} soft className="row-detail" style={{ display: 'block' }}>{r.detail}</Ui> : null}
            </div>
            <div className="row-actions">{r.actions}</div>
          </div>
        );
      })}
    </div>
  );
}

function Circle({ label, href, onClick, children }: { label: string; href?: string; onClick?: () => void; children: ReactNode }) {
  const { theme } = useGuest();
  const style = { borderColor: theme.ink };
  return href ? (
    <a className="circle" href={href} aria-label={label} style={style}>
      {children}
    </a>
  ) : (
    <button className="circle" onClick={onClick} aria-label={label} style={style}>
      {children}
    </button>
  );
}

function TitledList({ title, font, children }: { title?: string; font?: FontId; children: ReactNode }) {
  if (!title?.trim()) return <>{children}</>;
  return (
    <div>
      <Txt font={font} size={16} bold leading={1.4} className="list-title">
        {title.trim()}
      </Txt>
      {children}
    </div>
  );
}

function ListSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <Sheet title={title} onClose={onClose}>
      {children}
    </Sheet>
  );
}

const digits = (s: string) => s.replace(/\D/g, '');

function PhoneBlock({ block }: { block: BlockOfType<'phone'> }) {
  const { theme } = useGuest();
  const p = block.props;
  const [open, setOpen] = useState(false);
  const contacts = p.contacts ?? [];
  if (!contacts.length) return null;
  const rows: Row[] = contacts.map((c) => ({
    key: c.id,
    role: c.role,
    name: c.name,
    detail: p.showNumber ? c.phone : undefined,
    actions: (
      <>
        {p.showCall ? (
          <Circle label="전화" href={`tel:${digits(c.phone)}`}>
            <CallIcon color={theme.ink} />
          </Circle>
        ) : null}
        {p.showSms ? (
          <Circle label="문자" href={`sms:${digits(c.phone)}`}>
            <SmsIcon color={theme.ink} />
          </Circle>
        ) : null}
      </>
    ),
  }));
  return (
    <div style={{ marginBottom: GAP_HEIGHT[p.gapBelow] ?? 0 }}>
      {p.view === 'button' ? (
        <InvButton label={p.buttonLabel || '연락하기'} tone="outline" onClick={() => setOpen(true)} />
      ) : (
        <TitledList title={p.title} font={block.style?.font}>
          <RowList rows={rows} lines={p.lines} font={block.style?.font} />
        </TitledList>
      )}
      {open ? (
        <ListSheet title={p.buttonLabel || '연락하기'} onClose={() => setOpen(false)}>
          <RowList rows={rows} lines={p.lines} font={block.style?.font} />
        </ListSheet>
      ) : null}
    </div>
  );
}

function EmailBlock({ block }: { block: BlockOfType<'email'> }) {
  const { theme, copy } = useGuest();
  const p = block.props;
  const [open, setOpen] = useState(false);
  const entries = p.entries ?? [];
  if (!entries.length) return null;
  const rows: Row[] = entries.map((e) => ({
    key: e.id,
    role: e.role,
    name: e.name,
    detail: e.email,
    actions: (
      <>
        {p.showCopy ? (
          <Circle label="메일 주소 복사" onClick={() => copy(e.email, '메일 주소를 복사했어요')}>
            <CopyIcon color={theme.ink} />
          </Circle>
        ) : null}
        {p.showMail ? (
          <Circle label="메일 보내기" href={`mailto:${e.email}`}>
            <MailIcon color={theme.ink} />
          </Circle>
        ) : null}
      </>
    ),
  }));
  return (
    <div style={{ marginBottom: GAP_HEIGHT[p.gapBelow] ?? 0 }}>
      {p.view === 'button' ? (
        // 주소가 하나면 바로 메일 앱, 여럿이면 고르게 해요.
        entries.length === 1 ? (
          <InvButton label={p.buttonLabel || '메일 보내기'} tone="outline" href={`mailto:${entries[0].email}`} />
        ) : (
          <InvButton label={p.buttonLabel || '메일 보내기'} tone="outline" onClick={() => setOpen(true)} />
        )
      ) : (
        <TitledList title={p.title} font={block.style?.font}>
          <RowList rows={rows} lines={p.lines} font={block.style?.font} />
        </TitledList>
      )}
      {open ? (
        <ListSheet title={p.buttonLabel || '메일 보내기'} onClose={() => setOpen(false)}>
          <RowList rows={rows} lines={p.lines} font={block.style?.font} />
        </ListSheet>
      ) : null}
    </div>
  );
}

function AccountBlock({ block }: { block: BlockOfType<'account'> }) {
  const { theme, copy } = useGuest();
  const p = block.props;
  const [open, setOpen] = useState(p.view === 'open');
  const accounts = p.accounts ?? [];
  if (!accounts.length) return null;
  const rows: Row[] = accounts.map((a) => {
    const pay = safeHttpUrl(a.kakaoPay);
    return {
      key: a.id,
      role: a.role,
      name: a.holder,
      detail: `${shortBank(a.bank)} ${a.number}`,
      actions: (
        <>
          {p.showCopy ? (
            <Circle label="계좌번호 복사" onClick={() => copy(digits(a.number), '계좌번호를 복사했어요')}>
              <CopyIcon color={theme.ink} />
            </Circle>
          ) : null}
          {p.showKakaoPay ? (
            pay ? (
              <a className="pay" href={pay} target="_blank" rel="noopener noreferrer" aria-label="카카오페이로 송금">
                pay
              </a>
            ) : (
              <span className="pay-blank" />
            )
          ) : null}
        </>
      ),
    };
  });
  return (
    <div style={{ marginBottom: GAP_HEIGHT[p.gapBelow] ?? 0 }}>
      <div className="acc">
        <button className={`acc-head${open ? ' open' : ''}`} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <Txt font={block.style?.font} size={15} bold leading={1.4} className="acc-title">
            {p.title || '계좌번호'}
          </Txt>
          <Ui size={14} soft className="acc-chev">
            {open ? '⌃' : '⌄'}
          </Ui>
        </button>
        {open ? <RowList rows={rows} lines={p.lines} closingLine={false} font={block.style?.font} /> : null}
      </div>
    </div>
  );
}

// ── 장소 · 일시 ──────────────────────────────────────────────────────────────

function MapBlock({ block }: { block: BlockOfType<'map'> }) {
  const { venue, theme, copy } = useGuest();
  const p = block.props;
  const name = venue?.name?.trim() ?? '';
  if (!name) return null;
  const address = venueAddressLine(venue);
  const query = venueQuery(venue);
  const tone = p.shape === 'fill' ? 'fill' : 'outline';
  return (
    <div className="map">
      <Txt font={block.style?.font} size={18} bold leading={1.4} className="t-center">
        {name}
      </Txt>
      {address || p.showCopy ? (
        <div className="map-addr">
          {address ? (
            <Txt font={block.style?.font} size={13.5} soft leading={1.6} className="t-center">
              {address}
            </Txt>
          ) : null}
          {p.showCopy ? (
            <button onClick={() => copy(address || name, '주소를 복사했어요')} aria-label="주소 복사" style={{ padding: 6 }}>
              <CopyIcon size={13} color={theme.inkSoft} />
            </button>
          ) : null}
        </div>
      ) : null}
      {p.showNaver || p.showKakao ? (
        <div className="map-btns">
          {p.showNaver ? <InvButton label="네이버 지도" tone={tone} icon={<NaverMapIcon />} href={mapUrl('naver', query, p.naverUrl)} external /> : null}
          {p.showKakao ? <InvButton label="카카오맵" tone={tone} icon={<KakaoMapIcon />} href={mapUrl('kakao', query, p.kakaoUrl)} external /> : null}
        </div>
      ) : null}
    </div>
  );
}

function DateTimeBlock({ block }: { block: BlockOfType<'datetime'> }) {
  const { eventAt, title, venue, theme, now } = useGuest();
  const p = block.props;
  const font = block.style?.font;
  if (!p.showWhen && !p.showDday && !p.showCalendar && !p.showCalendarButton) return null;
  const cells = monthGrid(eventAt);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const eventParts = new Date(new Date(eventAt).getTime() + 9 * 3600_000);
  const day = eventParts.getUTCDate();
  const circle = p.circleColor === 'red' ? EVENT_RED : theme.accent;
  const download = () => {
    const ics = buildIcs(title, eventAt, venue?.name?.trim() ?? '', String(Date.parse(eventAt)));
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invitation.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };
  const month = `${eventParts.getUTCFullYear()}. ${String(eventParts.getUTCMonth() + 1).padStart(2, '0')}`;
  return (
    <div>
      {p.showWhen ? (
        <Txt font={font} size={17} bold leading={1.5} className="t-center">
          {formatWhen(eventAt)}
        </Txt>
      ) : null}
      {p.showDday ? (
        <span className={`dt-band${p.showCalendar ? ' before-cal' : ''}`} suppressHydrationWarning>
          {formatDday(eventAt, now)}
        </span>
      ) : null}
      {p.showCalendar ? (
        <div className="cal" style={{ ['--circle' as string]: circle }}>
          <Txt font={font} size={20} bold leading={1.3} className="cal-title">
            {month}
          </Txt>
          <div className="cal-grid">
            {weekdayLabels().map((w, i) => (
              <div key={w} className={`cal-cell wd${i === 0 ? ' sun' : ''}`}>
                {w}
              </div>
            ))}
            {weeks.flatMap((week, w) =>
              week.map((d, i) => (
                <div key={`${w}-${i}`} className={`cal-cell${i === 0 ? ' sun' : ''}`}>
                  {d ? <span className={`cal-day${d === day ? ' event' : ''}`}>{d}</span> : null}
                </div>
              )),
            )}
          </div>
        </div>
      ) : null}
      {p.showCalendarButton ? (
        <div className="dt-btn hug-wrap">
          <InvButton label="캘린더에 추가" tone={p.buttonTone === 'inverse' ? 'fill' : 'outline'} hug icon={<CalendarIcon color={p.buttonTone === 'inverse' ? theme.onAccent : theme.accentInk} />} onClick={download} />
        </div>
      ) : null}
    </div>
  );
}

// ── 참석 응답 · 방명록 ───────────────────────────────────────────────────────

function RsvpBlock({ block }: { block: BlockOfType<'rsvp'> }) {
  const { now, openRsvp } = useGuest();
  const p = block.props;
  const closed = isPastDeadline(p.deadline, now);
  return (
    <div className="feat">
      {p.intro?.trim() ? (
        <Txt font={block.style?.font} size={15} soft className="t-center pre">
          {p.intro}
        </Txt>
      ) : null}
      <InvButton label={closed ? '응답이 마감됐어요' : p.buttonLabel || '참석 의사 전달하기'} tone="fill" disabled={closed} onClick={() => openRsvp(block)} />
      {p.deadline && !closed ? (
        <Ui size={12} soft className="t-center" style={{ display: 'block' }}>
          {`${formatDeadline(p.deadline)} 자정까지 응답해 주세요`}
        </Ui>
      ) : null}
    </div>
  );
}

function GuestbookBlock({ block }: { block: BlockOfType<'guestbook'> }) {
  const { openGuestbook } = useGuest();
  const p = block.props;
  return (
    <div className="feat">
      {p.intro?.trim() ? (
        <Txt font={block.style?.font} size={13.5} soft className="t-center pre">
          {p.intro}
        </Txt>
      ) : null}
      {p.visibility === 'public' ? <GuestbookList recent={p.recentCount ?? 3} /> : null}
      <InvButton label={p.buttonLabel || '방명록 남기기'} tone="outline" onClick={() => openGuestbook(block)} />
    </div>
  );
}
