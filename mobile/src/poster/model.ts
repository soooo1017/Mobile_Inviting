import type { Crop, Photo } from '../editor/types';

// 홍보물 (docs/EDITOR_PLAN §13) — 템플릿 4종 + 넣을 정보 + 글 · QR · 사진의 위치 · 크기 · 색.
// 모든 좌표 · 크기는 템플릿의 기본 크기(base 단위)로 저장해서, 화면 크기가 달라도 같은 모습이 돼요.

export type TemplateId = 1 | 2 | 3 | 4;
export type TextKey = 'ment' | 'name' | 'date' | 'place';
export type ElKey = TextKey | 'qr' | 'photo';
export const TEXT_KEYS: TextKey[] = ['ment', 'name', 'date', 'place'];

export type Rect = { x: number; y: number; w: number; h: number };
export type Frame = Rect;

/** x · y가 있으면 직접 옮긴 글(자기 자리에 고정), 없으면 템플릿의 기본 줄(그룹) 안에서 쌓여요. */
export type TextState = { x?: number; y?: number; scale: number; color?: string };
export type QrState = { x?: number; y?: number; size?: number };

export type PosterDesign = {
  template: TemplateId;
  /** 초대 멘트 — 한 줄, 20자까지. 비우면 홍보물에 안 들어가요. */
  ment: string;
  show: { name: boolean; date: boolean; place: boolean; address: boolean };
  /** 없으면 초대장 대표 사진. */
  photo?: Photo;
  crop: Crop;
  /** 없으면 템플릿 기본 사진 틀. */
  frame?: Frame;
  /** 없으면 초대장 배경색. */
  bg?: string;
  text: Record<TextKey, TextState>;
  qr: QrState;
};

export const MENT_MAX = 20;

export const QR_MIN = 52; // "초대장 보기" 글씨가 한 줄로 들어가는 폭 — 이보다 작으면 스캔도 어려워요
export const QR_MAX = 110;
export const TEXT_STEPS = [0.75, 0.9, 1, 1.2, 1.45];
export const TEXT_SCALE_MIN = TEXT_STEPS[0];
export const TEXT_SCALE_MAX = TEXT_STEPS[TEXT_STEPS.length - 1];
export const PHOTO_MIN = 80;

/** QR 카드 = QR + 안쪽 여백 6 + "초대장 보기" 줄. */
export function qrBox(size: number) {
  return { w: size + 12, h: size + 12 + 14 };
}

export type TemplateSpec = {
  id: TemplateId;
  label: string;
  ratio: string;
  w: number;
  h: number;
  /** 저장되는 이미지 크기(px). */
  out: { w: number; h: number };
  photo: Frame & { radius: number; fixed: boolean };
  group: { left: number; right: number; top?: number; bottom?: number; align: 'flex-start' | 'center' };
  qr: { size: number; right?: number; bottom: number; centerX?: boolean };
  /** 글자 기본 크기. */
  fonts: Record<TextKey, number>;
  /** 글이 사진 위에 올라가는 템플릿 — 글씨 기본색이 밝은색. */
  overPhoto: boolean;
};

export const TEMPLATES: Record<TemplateId, TemplateSpec> = {
  1: {
    id: 1, label: '사진 위', ratio: '4:5', w: 320, h: 400, out: { w: 1080, h: 1350 },
    photo: { x: 0, y: 0, w: 320, h: 226, radius: 0, fixed: false },
    group: { left: 20, right: 96, top: 244, align: 'flex-start' },
    qr: { size: 58, right: 16, bottom: 16 },
    fonts: { ment: 12, name: 26, date: 13, place: 13 },
    overPhoto: false,
  },
  2: {
    id: 2, label: '사진 가득', ratio: '4:5', w: 320, h: 400, out: { w: 1080, h: 1350 },
    photo: { x: 0, y: 0, w: 320, h: 400, radius: 0, fixed: true },
    group: { left: 20, right: 100, bottom: 22, align: 'flex-start' },
    qr: { size: 60, right: 16, bottom: 18 },
    fonts: { ment: 12, name: 27, date: 13, place: 13 },
    overPhoto: true,
  },
  3: {
    id: 3, label: '옆으로', ratio: '1:1', w: 320, h: 320, out: { w: 1080, h: 1080 },
    photo: { x: 0, y: 0, w: 150, h: 320, radius: 0, fixed: false },
    group: { left: 166, right: 14, top: 22, align: 'flex-start' },
    qr: { size: 52, right: 14, bottom: 14 },
    fonts: { ment: 11, name: 22, date: 11, place: 11 },
    overPhoto: false,
  },
  4: {
    id: 4, label: '인쇄용', ratio: 'A4', w: 300, h: 424, out: { w: 2100, h: 2968 },
    photo: { x: 20, y: 20, w: 260, h: 150, radius: 8, fixed: false },
    group: { left: 20, right: 20, top: 184, align: 'center' },
    qr: { size: 68, bottom: 14, centerX: true },
    fonts: { ment: 12, name: 27, date: 12, place: 12 },
    overPhoto: false,
  },
};

export const TEMPLATE_IDS: TemplateId[] = [1, 2, 3, 4];

export function photoFrame(d: PosterDesign): Frame {
  const spec = TEMPLATES[d.template];
  if (spec.photo.fixed) return { x: spec.photo.x, y: spec.photo.y, w: spec.photo.w, h: spec.photo.h };
  return d.frame ?? { x: spec.photo.x, y: spec.photo.y, w: spec.photo.w, h: spec.photo.h };
}

export function qrSize(d: PosterDesign): number {
  return d.qr.size ?? TEMPLATES[d.template].qr.size;
}

export function qrRect(d: PosterDesign): Rect {
  const spec = TEMPLATES[d.template];
  const { w, h } = qrBox(qrSize(d));
  if (d.qr.x !== undefined && d.qr.y !== undefined) return { x: d.qr.x, y: d.qr.y, w, h };
  const x = spec.qr.centerX ? (spec.w - w) / 2 : spec.w - (spec.qr.right ?? 0) - w;
  return { x, y: spec.h - spec.qr.bottom - h, w, h };
}

const defaultText = (): Record<TextKey, TextState> => ({
  ment: { scale: 1 },
  name: { scale: 1 },
  date: { scale: 1 },
  place: { scale: 1 },
});

export function emptyDesign(template: TemplateId = 1): PosterDesign {
  return {
    template,
    ment: '',
    show: { name: true, date: true, place: true, address: false },
    crop: { x: 0, y: 0, scale: 1 },
    text: defaultText(),
    qr: {},
  };
}

/** 템플릿을 바꾸면 위치 · 크기 · 색은 새 템플릿의 기본으로 돌아가요 (정보 · 멘트 · 사진은 그대로). */
export function withTemplate(d: PosterDesign, template: TemplateId): PosterDesign {
  return { ...d, template, frame: undefined, bg: undefined, text: defaultText(), qr: {} };
}

export function visibleTextKeys(d: PosterDesign): TextKey[] {
  return TEXT_KEYS.filter((k) => (k === 'ment' ? d.ment.trim().length > 0 : k === 'name' ? d.show.name : k === 'date' ? d.show.date : d.show.place));
}

export function isMoved(s: TextState): boolean {
  return s.x !== undefined && s.y !== undefined;
}

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
}

/** 글끼리 · 글과 QR이 겹치는 항목들 (사진은 바탕이라 겹쳐도 돼요). */
export function overlapping(rects: Partial<Record<ElKey, Rect>>): ElKey[] {
  const keys = (Object.keys(rects) as ElKey[]).filter((k) => k !== 'photo');
  const bad = new Set<ElKey>();
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = rects[keys[i]];
      const b = rects[keys[j]];
      if (a && b && overlaps(a, b)) {
        bad.add(keys[i]);
        bad.add(keys[j]);
      }
    }
  }
  return [...bad];
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 행사 종류별 기본 멘트 (입력칸에 회색 예시로만 보여요). */
export function exampleMent(typeName: string): string {
  return `${typeName}에 초대합니다`;
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];
/** 2027. 5. 22. (토) 오후 1:00 */
export function posterDateText(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const hh = h % 12 || 12;
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. (${WEEKDAY_KO[d.getDay()]}) ${h < 12 ? '오전' : '오후'} ${hh}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 화면에서 잰 글의 크기 · 기본 줄 안의 위치 · 기본 줄(그룹)의 위치 (base 단위). */
export type Measured = {
  sizes: Partial<Record<TextKey, { w: number; h: number }>>;
  flow: Partial<Record<TextKey, { x: number; y: number }>>;
  group?: { x: number; y: number };
};

export function textRect(key: TextKey, d: PosterDesign, m: Measured): Rect | null {
  const size = m.sizes[key];
  if (!size) return null;
  const st = d.text[key];
  if (isMoved(st)) return { x: st.x as number, y: st.y as number, ...size };
  const f = m.flow[key];
  if (!f || !m.group) return null;
  return { x: m.group.x + f.x, y: m.group.y + f.y, ...size };
}

/** 보이는 모든 항목의 자리 (사진 포함). */
export function allRects(d: PosterDesign, m: Measured): Partial<Record<ElKey, Rect>> {
  const out: Partial<Record<ElKey, Rect>> = { photo: photoFrame(d), qr: qrRect(d) };
  for (const k of visibleTextKeys(d)) {
    const r = textRect(k, d, m);
    if (r) out[k] = r;
  }
  return out;
}

/** 처음 끌 때, 기본 줄에 쌓여 있던 글을 모두 지금 자리에 고정해요 (하나만 옮겨도 나머지가 밀려 올라가지 않게). */
export function freezeTexts(d: PosterDesign, m: Measured): PosterDesign {
  let next = d;
  for (const k of visibleTextKeys(d)) {
    if (isMoved(d.text[k])) continue;
    const r = textRect(k, d, m);
    if (r) next = { ...next, text: { ...next.text, [k]: { ...next.text[k], x: r.x, y: r.y } } };
  }
  return next;
}
