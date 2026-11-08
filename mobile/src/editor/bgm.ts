import type { AudioSource } from 'expo-audio';
import type { Bgm } from './types';

export const BGM_MAX_BYTES = 15 * 1024 * 1024;
export const BGM_EXTENSIONS = ['mp3', 'm4a'];

/** 노래 편집: 구간은 최소 이만큼, 속도는 아래 값 중에서 골라요. */
export const MIN_CLIP = 10;
export const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

export type BgmLicense = 'CC BY' | 'PD';

/**
 * 앱이 제공하는 배경음악. 라이선스 · 출처 증빙은 docs/BGM_LICENSES.md에 있어요.
 * 음원 파일(bgm001.mp3 …)은 저작권 · 용량 때문에 git에 넣지 않고, 출시 전에 Supabase Storage의
 * 공개 폴더에 올려요. 앱은 `EXPO_PUBLIC_BGM_BASE_URL/<id>.mp3`로 불러와요(.env.example 참고).
 */
export type BgmTrack = {
  id: string;
  /** 한글 곡 이름. */
  name: string;
  /** 원제 (곡 이름 아래 · 곡 상세). */
  orig: string;
  /** 작곡가 (한글, 짧게). */
  composer: string;
  /** 초대장 맨 아래 '제목' 줄 — 원제(작곡가 영문 이름). */
  credit: string;
  performer: string;
  license: BgmLicense;
  sourceUrl: string;
  durationSec: number;
  /** 파형 — 72개 막대 높이(0~100). 음원에서 미리 계산해 둔 값이에요. */
  peaks: number[];
};

export const BGM_TRACKS: BgmTrack[] = [
  {
    id: 'bgm001',
    name: '사랑의 인사',
    orig: "Salut d'amour, Op. 12",
    composer: '엘가',
    credit: "“Salut d'amour, Op. 12” (Edward Elgar)",
    performer: 'Emanuel Salvador, Pau Casan',
    license: 'CC BY',
    sourceUrl: 'https://musopen.org/music/5232-salut-damour-op-12/',
    durationSec: 164,
    peaks: [
      8, 15, 22, 55, 51, 70, 52, 27, 67, 79, 77, 47, 34, 50, 38, 66, 65, 30, 66, 84, 77, 35, 21, 42, 71, 55, 29, 22, 68, 58, 33, 8, 37, 39, 34, 59,
      46, 36, 56, 72, 64, 62, 47, 90, 34, 64, 79, 95, 61, 88, 100, 79, 33, 34, 28, 16, 35, 62, 26, 47, 35, 17, 15, 10, 14, 10, 8, 8, 8, 8, 8, 8,
    ],
  },
  {
    id: 'bgm002',
    name: '나비 5번',
    orig: 'Papillons, Op. 2 No. 5',
    composer: '슈만',
    credit: '“Papillons, Op. 2 No. 5” (Robert Schumann)',
    performer: 'Greg Tait',
    license: 'PD',
    sourceUrl: 'https://musopen.org/music/2360-papillons-op-2/',
    durationSec: 104,
    peaks: [
      14, 33, 54, 58, 53, 42, 42, 44, 39, 53, 53, 48, 52, 46, 67, 74, 39, 27, 46, 51, 63, 46, 39, 39, 45, 42, 54, 59, 48, 42, 56, 75, 61, 59, 81, 93,
      78, 70, 100, 82, 56, 50, 47, 65, 83, 52, 81, 68, 59, 54, 38, 43, 46, 41, 75, 47, 40, 48, 45, 33, 37, 40, 45, 28, 41, 40, 21, 8, 8, 8, 8, 8,
    ],
  },
];

const BASE = (process.env.EXPO_PUBLIC_BGM_BASE_URL ?? '').replace(/\/+$/, '');
/** 음원 주소가 연결돼 있는지 — 아직 업로드 전이면 곡 목록의 미리 듣기는 쓸 수 없어요. */
export const BGM_AUDIO_READY = BASE.length > 0;

export const bgmTrackById = (id: string | undefined): BgmTrack | undefined => BGM_TRACKS.find((t) => t.id === id);
export const bgmTrackSource = (track: BgmTrack): AudioSource | null => (BASE ? { uri: `${BASE}/${track.id}.mp3` } : null);

/** What actually plays, or null when 배경음악 is off, nothing is picked, or the file is not reachable yet. */
export function bgmSource(bgm: Bgm | undefined): AudioSource | null {
  if (!bgm) return null;
  if (bgm.mode === 'file' && bgm.file) return { uri: bgm.file.uri };
  if (bgm.mode === 'list') {
    const track = bgmTrackById(bgm.trackId);
    return track ? bgmTrackSource(track) : null;
  }
  return null;
}

export type ClipRange = { start: number; end: number | null; speed: number };

/** 노래 편집에서 정한 재생 구간 · 속도. end = null → 끝까지. */
export function bgmClip(bgm: Bgm | undefined): ClipRange {
  return {
    start: bgm?.start ?? 0,
    end: bgm?.end ?? null,
    speed: bgm?.speed ?? 1,
  };
}

export function bgmDuration(bgm: Bgm | undefined): number {
  if (bgm?.mode === 'file') return bgm.file?.duration ?? 0;
  return bgmTrackById(bgm?.trackId)?.durationSec ?? 0;
}

export function bgmEdited(bgm: Bgm | undefined): boolean {
  return !!bgm && (bgm.start != null || bgm.end != null || (bgm.speed != null && bgm.speed !== 1));
}

/** 초대장 맨 아래 문구의 '제목' 줄 끝에 붙는 편집 표시 (CC BY는 변경 표시가 필요해요). */
export function bgmEditNotes(bgm: Bgm | undefined): string[] {
  const notes: string[] = [];
  if (bgm?.start != null || bgm?.end != null) notes.push('일부 구간 사용');
  if (bgm?.speed != null && bgm.speed !== 1) notes.push('속도 조정');
  return notes;
}

/** ⚙ 전체 설정 row: [label, value]. */
export function bgmSummary(bgm: Bgm | undefined): [string, string] {
  const edits: string[] = [];
  if (bgm?.start != null || bgm?.end != null) {
    const dur = bgmDuration(bgm);
    edits.push(`구간 ${formatClock(bgm?.start ?? 0, true)}~${formatClock(bgm?.end ?? dur, true)}`);
  }
  if (bgm?.speed != null && bgm.speed !== 1) edits.push(`${bgm.speed}×`);
  const extra = edits.join(' · ');
  if (bgm?.mode === 'file' && bgm.file) return [bgm.file.name, extra || '내 음악'];
  if (bgm?.mode === 'list') {
    const track = bgmTrackById(bgm.trackId);
    if (track) return [track.name, extra || track.composer];
    return ['곡을 골라주세요', ''];
  }
  return ['끔', ''];
}

export function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/** m:ss — precise = 0.1초 단위가 있으면 m:ss.d. */
export function formatClock(seconds: number, precise = false): string {
  const r = precise ? Math.round(Math.max(0, seconds) * 10) / 10 : Math.round(Math.max(0, seconds));
  const m = Math.floor(r / 60);
  const s = r - m * 60;
  const si = Math.floor(s + 1e-9);
  const d = Math.round((s - si) * 10);
  return `${m}:${String(si).padStart(2, '0')}${precise && d ? `.${d}` : ''}`;
}
