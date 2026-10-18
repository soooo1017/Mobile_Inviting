import type { AudioSource } from 'expo-audio';
import type { Bgm } from './types';

export type BgmCategory = 'calm' | 'bright' | 'classic';
export const BGM_CATEGORIES: { value: 'all' | BgmCategory; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'calm', label: '잔잔한' },
  { value: 'bright', label: '밝은' },
  { value: 'classic', label: '클래식' },
];

export type BgmTrack = { id: string; name: string; category: BgmCategory; source: number };

/**
 * 곡 고르기 목록 — not decided yet, so it ships empty and the screen says it's being prepared.
 * Add tracks here as `{ id, name, category, source: require('../../assets/bgm/….mp3') }`.
 */
export const BGM_TRACKS: BgmTrack[] = [];

export const BGM_MAX_BYTES = 15 * 1024 * 1024;
export const BGM_EXTENSIONS = ['mp3', 'm4a'];

/** What actually plays, or null when 배경음악 is off or nothing is picked. */
export function bgmSource(bgm: Bgm | undefined): AudioSource | null {
  if (!bgm) return null;
  if (bgm.mode === 'file' && bgm.file) return { uri: bgm.file.uri };
  if (bgm.mode === 'list') return BGM_TRACKS.find((t) => t.id === bgm.trackId)?.source ?? null;
  return null;
}

/** ⚙ 전체 설정 row: [label, value]. */
export function bgmSummary(bgm: Bgm | undefined): [string, string] {
  if (bgm?.mode === 'file' && bgm.file) return [bgm.file.name, '내 음악'];
  if (bgm?.mode === 'list') {
    const track = BGM_TRACKS.find((t) => t.id === bgm.trackId);
    if (track) return [track.name, '곡 고르기'];
  }
  return ['끔', ''];
}

export function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
