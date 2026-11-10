'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Sheet, Ui, store, storeSet, useGuest, visitorId } from './guest';
import { formatMonthDay, formatPhone, formatDeadline, isPastDeadline } from '../lib/format';
import { rpc } from '../lib/supabase';
import { GUESTBOOK_LENGTH, RSVP_MESSAGE_LENGTH, type BlockOfType } from '../lib/model';

/** 서버가 돌려주는 오류 번호를 하객에게 보여줄 말로. */
function sendError(code: string): string {
  if (code === 'P0001') return '지금은 받을 수 없는 초대장이에요.';
  if (code === 'P0002') return '잠시 뒤에 다시 시도해 주세요.';
  if (code === 'network') return '보내지 못했어요. 네트워크를 확인하고 다시 눌러주세요.';
  return '보내지 못했어요. 잠시 뒤에 다시 시도해 주세요.';
}

// ── 방명록 목록 ──────────────────────────────────────────────────────────────

type Post = { id: string; name: string; side: number | null; body: string; created_at: string };

export function GuestbookList({ recent }: { recent: number }) {
  const { slug, sides, guestbookVersion } = useGuest();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [all, setAll] = useState(false);

  useEffect(() => {
    let live = true;
    rpc<Post[]>('list_guestbook', { p_slug: slug, p_limit: 50 }).then((res) => {
      if (live) setPosts(res.ok && Array.isArray(res.data) ? res.data : []);
    });
    return () => {
      live = false;
    };
  }, [slug, guestbookVersion]);

  if (posts === null) return null;
  if (!posts.length) {
    return (
      <Ui size={12.5} soft className="t-center" style={{ display: 'block', padding: '10px 0' }}>
        아직 남겨진 글이 없어요
      </Ui>
    );
  }
  const shown = all ? posts : posts.slice(0, recent);
  return (
    <div className="gb-list">
      {shown.map((p) => (
        <div key={p.id} className="gb-post">
          <div className="gb-head">
            <b>{p.name}</b>
            {p.side !== null && sides[p.side] ? <span className="gb-side">{sides[p.side]}</span> : null}
            <span className="gb-date">{formatMonthDay(p.created_at)}</span>
          </div>
          <p className="gb-body pre">{p.body}</p>
        </div>
      ))}
      {!all && posts.length > recent ? (
        <button className="gb-more" onClick={() => setAll(true)}>
          {`전체 보기 (${posts.length})`}
        </button>
      ) : null}
    </div>
  );
}

// ── 공용 입력 조각 ───────────────────────────────────────────────────────────

function SidePicker({ sides, value, onChange }: { sides: [string, string]; value: 0 | 1 | null; onChange: (v: 0 | 1) => void }) {
  return (
    <div className="field">
      <span className="lbl">어느 쪽 손님이신가요?</span>
      <div className="chips">
        {sides.map((s, i) => (
          <button type="button" key={s} className={`chip${value === i ? ' on' : ''}`} onClick={() => onChange(i as 0 | 1)} aria-pressed={value === i}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 참석 응답 ────────────────────────────────────────────────────────────────

type Saved = { name: string; attending: boolean; side: 0 | 1 | null; companions: number; meal: boolean | null; phone: string; message: string };

export function RsvpSheet({ block, onClose }: { block: BlockOfType<'rsvp'>; onClose: () => void }) {
  const { slug, sides, now, toast } = useGuest();
  const f = block.props.fields;
  const key = `moiso.rsvp.${slug}`;
  const [saved] = useState<Saved | null>(() => {
    try {
      const raw = store(key);
      return raw ? (JSON.parse(raw) as Saved) : null;
    } catch {
      return null;
    }
  });
  const [name, setName] = useState(saved?.name ?? '');
  const [attending, setAttending] = useState<boolean | null>(saved?.attending ?? null);
  const [side, setSide] = useState<0 | 1 | null>(saved?.side ?? null);
  const [companions, setCompanions] = useState(saved?.companions ?? 0);
  const [meal, setMeal] = useState<boolean | null>(saved?.meal ?? null);
  const [phone, setPhone] = useState(saved?.phone ?? '');
  const [message, setMessage] = useState(saved?.message ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const askSide = f.side && sides.length === 2;
  const closed = isPastDeadline(block.props.deadline, now);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!name.trim()) return setError('이름을 적어주세요.');
    if (attending === null) return setError('참석 여부를 골라주세요.');
    if (attending && askSide && side === null) return setError('어느 쪽 손님인지 골라주세요.');
    if (attending && f.meal && meal === null) return setError('식사 여부를 골라주세요.');
    if (attending && f.phone && phone.replace(/\D/g, '').length < 9) return setError('연락처를 확인해 주세요.');
    setError('');
    setBusy(true);
    const res = await rpc('submit_rsvp', {
      p_slug: slug,
      p_visitor: visitorId(),
      p_name: name.trim(),
      p_attending: attending,
      p_side: askSide ? side : null,
      p_companions: attending && f.companions ? companions : 0,
      p_meal: attending && f.meal ? meal : null,
      p_phone: f.phone && phone.trim() ? phone.trim() : null,
      p_message: f.message && message.trim() ? message.trim() : null,
    });
    setBusy(false);
    if (!res.ok) return setError(sendError(res.code));
    storeSet(key, JSON.stringify({ name: name.trim(), attending, side, companions, meal, phone, message } satisfies Saved));
    toast(attending ? '참석 의사를 전달했어요' : '응답을 전달했어요');
    onClose();
  };

  return (
    <Sheet title="참석 응답" onClose={onClose}>
      <form className="form" onSubmit={submit} noValidate>
        {saved ? <p className="note">이미 보낸 응답이 있어요. 다시 보내면 바뀌어요.</p> : null}
        <div className="field">
          <label htmlFor="rsvp-name">이름</label>
          <input id="rsvp-name" className="inp" value={name} maxLength={40} autoComplete="name" onChange={(e) => setName(e.target.value)} placeholder="이름을 적어주세요" />
        </div>
        <div className="field">
          <span className="lbl">참석 여부</span>
          <div className="chips">
            <button type="button" className={`chip${attending === true ? ' on' : ''}`} onClick={() => setAttending(true)} aria-pressed={attending === true}>
              참석할게요
            </button>
            <button type="button" className={`chip${attending === false ? ' on' : ''}`} onClick={() => setAttending(false)} aria-pressed={attending === false}>
              못 가요
            </button>
          </div>
        </div>
        {attending && askSide ? <SidePicker sides={sides as [string, string]} value={side} onChange={setSide} /> : null}
        {attending && f.companions ? (
          <div className="field">
            <span className="lbl">
              함께 오시는 분 <span className="opt">본인 외</span>
            </span>
            <div className="stepper">
              <button type="button" onClick={() => setCompanions((n) => Math.max(0, n - 1))} disabled={companions <= 0} aria-label="줄이기">
                −
              </button>
              <span>{companions}</span>
              <button type="button" onClick={() => setCompanions((n) => Math.min(20, n + 1))} disabled={companions >= 20} aria-label="늘리기">
                ＋
              </button>
            </div>
          </div>
        ) : null}
        {attending && f.meal ? (
          <div className="field">
            <span className="lbl">식사</span>
            <div className="chips">
              <button type="button" className={`chip${meal === true ? ' on' : ''}`} onClick={() => setMeal(true)} aria-pressed={meal === true}>
                할게요
              </button>
              <button type="button" className={`chip${meal === false ? ' on' : ''}`} onClick={() => setMeal(false)} aria-pressed={meal === false}>
                안 할게요
              </button>
            </div>
          </div>
        ) : null}
        {f.phone ? (
          <div className="field">
            <label htmlFor="rsvp-phone">연락처</label>
            <input id="rsvp-phone" className="inp" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="010-0000-0000" />
          </div>
        ) : null}
        {f.message ? (
          <div className="field">
            <label htmlFor="rsvp-msg">
              전하는 말 <span className="opt">선택</span>
            </label>
            <textarea id="rsvp-msg" className="inp" value={message} maxLength={RSVP_MESSAGE_LENGTH} onChange={(e) => setMessage(e.target.value)} />
          </div>
        ) : null}
        {block.props.deadline && !closed ? <p className="note">{`${formatDeadline(block.props.deadline)} 자정까지 응답해 주세요`}</p> : null}
        {error ? (
          <p className="err" role="alert">
            {error}
          </p>
        ) : null}
        <button className="ibtn fill" type="submit" disabled={busy || closed}>
          {busy ? '보내는 중…' : closed ? '응답이 마감됐어요' : '보내기'}
        </button>
      </form>
    </Sheet>
  );
}

// ── 방명록 쓰기 ──────────────────────────────────────────────────────────────

export function GuestbookSheet({ block, onClose, onPosted }: { block: BlockOfType<'guestbook'>; onClose: () => void; onPosted: () => void }) {
  const { slug, sides, toast } = useGuest();
  const [name, setName] = useState(() => store('moiso.name') ?? '');
  const [side, setSide] = useState<0 | 1 | null>(null);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const askSide = !!block.props.askSide && sides.length === 2;
  const privateOnly = block.props.visibility === 'private';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!name.trim()) return setError('이름을 적어주세요.');
    if (askSide && side === null) return setError('어느 쪽 손님인지 골라주세요.');
    if (!body.trim()) return setError('남기실 말을 적어주세요.');
    setError('');
    setBusy(true);
    const res = await rpc('post_guestbook', {
      p_slug: slug,
      p_visitor: visitorId(),
      p_name: name.trim(),
      p_body: body.trim(),
      p_side: askSide ? side : null,
      // 공개 · 우리만 보기는 서버가 방명록 설정을 보고 정해요(글마다 박아 두지 않아서, 주인이 설정을 바꾸면 쌓인 글에도 바로 적용돼요).
      p_secret: false,
    });
    setBusy(false);
    if (!res.ok) return setError(sendError(res.code));
    storeSet('moiso.name', name.trim());
    toast('방명록을 남겼어요');
    onPosted();
    onClose();
  };

  return (
    <Sheet title="방명록 남기기" onClose={onClose}>
      <form className="form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="gb-name">이름</label>
          <input id="gb-name" className="inp" value={name} maxLength={40} autoComplete="name" onChange={(e) => setName(e.target.value)} placeholder="이름을 적어주세요" />
        </div>
        {askSide ? <SidePicker sides={sides as [string, string]} value={side} onChange={setSide} /> : null}
        <div className="field">
          <label htmlFor="gb-body">축하의 말</label>
          <textarea id="gb-body" className="inp" value={body} maxLength={GUESTBOOK_LENGTH} onChange={(e) => setBody(e.target.value)} placeholder="따뜻한 한마디를 남겨주세요" />
          <span className="count">{`${body.length} / ${GUESTBOOK_LENGTH}`}</span>
        </div>
        {privateOnly ? <p className="note">남기신 글은 초대장 주인만 볼 수 있어요.</p> : null}
        {error ? (
          <p className="err" role="alert">
            {error}
          </p>
        ) : null}
        <button className="ibtn fill" type="submit" disabled={busy}>
          {busy ? '남기는 중…' : '남기기'}
        </button>
      </form>
    </Sheet>
  );
}
