import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '../lib/supabase';

/** 사진 · 내 음악 파일을 서버(Supabase Storage `invitation-media`)에 올리고 지우는 일 (docs/SERVER_STORAGE.md §13). */

export const MEDIA_BUCKET = 'invitation-media';
/** 사진은 올리기 전에 긴 변 1600px, JPEG 화질 0.75로 줄여요(장당 수백 KB). */
const MAX_SIDE = 1600;
const QUALITY = 0.75;

export type UploadResult = { ok: true; url: string; path: string; width?: number; height?: number } | { ok: false; kind: 'offline' | 'other'; message?: string };

const looksOffline = (message?: string) => /network|fetch|timeout|failed to|offline/i.test(message ?? '');

const randomName = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** `<내 id>/<초대장 id>/<이름>.<확장자>` — 올릴 때마다 새 이름이라 같은 주소를 다시 쓰지 않아요(캐시가 꼬이지 않게). */
export const mediaPath = (userId: string, projectId: string, ext: string) => `${userId}/${projectId}/${randomName()}.${ext}`;

const publicPrefix = () => supabase.storage.from(MEDIA_BUCKET).getPublicUrl('x').data.publicUrl.replace(/x$/, '');

/** 서버 파일 주소 → 보관함 안의 경로 (우리 보관함 주소가 아니면 null). */
export function pathFromUrl(url: string): string | null {
  const prefix = publicPrefix();
  return url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length)) : null;
}

/** 줄인 사진(폰 안의 임시 파일)을 만들어요. 올릴 때만 쓰고 원본은 그대로 둬요. */
async function shrinkPhoto(uri: string, width: number, height: number) {
  const ctx = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > MAX_SIDE) ctx.resize(width >= height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  const ref = await ctx.renderAsync();
  return ref.saveAsync({ compress: QUALITY, format: SaveFormat.JPEG });
}

async function put(path: string, localUri: string, contentType: string): Promise<{ ok: true; url: string } | { ok: false; kind: 'offline' | 'other'; message?: string }> {
  try {
    // React Native에서는 Blob · FormData 대신 ArrayBuffer로 올려야 해요.
    const bytes = await new File(localUri).arrayBuffer();
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, bytes, { contentType, upsert: true, cacheControl: '31536000' });
    if (error) return { ok: false, kind: looksOffline(error.message) ? 'offline' : 'other', message: error.message };
    return { ok: true, url: supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, kind: looksOffline(message) ? 'offline' : 'other', message };
  }
}

export async function uploadPhoto(userId: string, projectId: string, photo: { uri: string; width: number; height: number }): Promise<UploadResult> {
  let small: { uri: string; width: number; height: number };
  try {
    small = await shrinkPhoto(photo.uri, photo.width, photo.height);
  } catch (e) {
    return { ok: false, kind: 'other', message: e instanceof Error ? e.message : '사진을 줄이지 못했어요' };
  }
  const path = mediaPath(userId, projectId, 'jpg');
  const res = await put(path, small.uri, 'image/jpeg');
  return res.ok ? { ...res, path, width: small.width, height: small.height } : res;
}

const MUSIC_TYPES: Record<string, string> = { mp3: 'audio/mpeg', m4a: 'audio/mp4' };

export async function uploadMusic(userId: string, projectId: string, music: { uri: string; name: string }): Promise<UploadResult> {
  const ext = (music.name.split('.').pop() ?? music.uri.split('.').pop() ?? 'mp3').toLowerCase();
  const type = MUSIC_TYPES[ext] ?? 'audio/mpeg';
  const path = mediaPath(userId, projectId, MUSIC_TYPES[ext] ? ext : 'mp3');
  const res = await put(path, music.uri, type);
  return res.ok ? { ...res, path } : res;
}

/** 안 쓰는 파일을 서버에서 지워요. 성공하면 true. */
export async function removeFiles(paths: string[]): Promise<boolean> {
  if (!paths.length) return true;
  try {
    const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(paths);
    return !error;
  } catch {
    return false;
  }
}

/** 초대장을 지울 때 그 초대장 폴더의 파일을 전부 지워요(놓친 파일까지). */
export async function removeProjectFolder(userId: string, projectId: string): Promise<boolean> {
  try {
    const folder = `${userId}/${projectId}`;
    const { data, error } = await supabase.storage.from(MEDIA_BUCKET).list(folder, { limit: 1000 });
    if (error) return false;
    return removeFiles((data ?? []).filter((f) => f.name).map((f) => `${folder}/${f.name}`));
  } catch {
    return false;
  }
}
