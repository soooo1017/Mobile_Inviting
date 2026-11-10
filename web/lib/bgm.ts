import type { Bgm } from './model';

/**
 * 앱이 제공하는 배경음악 중 하객 화면에 "표기"가 필요한 정보 — 앱의 mobile/src/editor/bgm.ts 와 같은 곡 목록이에요.
 * CC BY 곡은 저작자 표시가 꼭 필요해서 초대장 맨 아래에 넣어요. 앱에 곡을 추가하면 여기에도 같이 추가해요(docs/WEB_VERCEL.md).
 * 음원 파일 자체는 Supabase Storage 공개 폴더 `bgm`에 있어요(NEXT_PUBLIC_BGM_BASE_URL/<id>.mp3).
 */
export type BgmTrack = { id: string; credit: string; performer: string; license: 'CC BY' | 'PD' };

export const BGM_TRACKS: BgmTrack[] = [
  { id: 'bgm001', credit: "“Salut d'amour, Op. 12” (Edward Elgar)", performer: 'Emanuel Salvador, Pau Casan', license: 'CC BY' },
  { id: 'bgm002', credit: '“Papillons, Op. 2 No. 5” (Robert Schumann)', performer: 'Greg Tait', license: 'PD' },
];

export function bgmTrackById(id: string | undefined): BgmTrack | undefined {
  return BGM_TRACKS.find((t) => t.id === id);
}

/** 재생할 주소 — 음원이 아직 연결 전이거나 꺼져 있으면 null. 내 음악은 서버에 올라간 https 주소일 때만 재생해요. */
export function bgmUrl(bgm: Bgm | undefined): string | null {
  if (!bgm) return null;
  if (bgm.mode === 'file') return bgm.file?.uri && /^https:\/\//i.test(bgm.file.uri) ? bgm.file.uri : null;
  if (bgm.mode === 'list') {
    const base = (process.env.NEXT_PUBLIC_BGM_BASE_URL ?? '').replace(/\/+$/, '');
    if (!base || !bgmTrackById(bgm.trackId)) return null;
    return `${base}/${bgm.trackId}.mp3`;
  }
  return null;
}

/** CC BY 곡은 "일부 구간 사용 · 속도 조정" 같은 변경 표시도 같이 해요. */
export function bgmEditNotes(bgm: Bgm | undefined): string[] {
  const notes: string[] = [];
  if (bgm?.start != null || bgm?.end != null) notes.push('일부 구간 사용');
  if (bgm?.speed != null && bgm.speed !== 1) notes.push('속도 조정');
  return notes;
}
