import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '../lib/supabase';

/**
 * 문의에 파일 붙이기 — 사진 · PDF · 텍스트를 Supabase Storage `inquiry-files`(비공개)에 올려요.
 * 올리는 건 만든 사람(나)뿐이고, 운영자는 대시보드 › Storage에서 열어봐요. 서버 설정은 supabase/schema.sql 10번.
 */

export const INQUIRY_BUCKET = 'inquiry-files';
export const MAX_FILES = 3;
export const MAX_BYTES = 10 * 1024 * 1024;
/** 사진은 올리기 전에 긴 변 2000px, JPEG 화질 0.8로 줄여요(화면 캡처 몇 장이 몇 MB가 되지 않게). */
const MAX_SIDE = 2000;
const QUALITY = 0.8;

export type PickedFile = { uri: string; name: string; size: number; type: string };
/** 문의 표(inquiries.attachments)에 저장되는 한 건. */
export type Attachment = { path: string; name: string; size: number; type: string };

const TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf', txt: 'text/plain' };
const extOf = (name: string) => (name.split('.').pop() ?? '').toLowerCase();

export const formatSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`);

/** 문의 번호로 쓰는 UUID(v4). 파일을 올린 뒤 같은 번호로 문의를 저장해서 파일과 문의를 이어요. */
export function newUuid(): string {
  const h = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i += 1) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += '-';
    else if (i === 14) out += '4';
    else if (i === 19) out += h[8 + Math.floor(Math.random() * 4)];
    else out += h[Math.floor(Math.random() * 16)];
  }
  return out;
}

/** 폰 앨범에서 사진 한 장(줄여서). 취소하면 null. */
export async function pickPhoto(): Promise<PickedFile | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1 });
  if (res.canceled || !res.assets[0]) return null;
  const a = res.assets[0];
  const ctx = ImageManipulator.manipulate(a.uri);
  if (Math.max(a.width, a.height) > MAX_SIDE) ctx.resize(a.width >= a.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  const ref = await ctx.renderAsync();
  const small = await ref.saveAsync({ compress: QUALITY, format: SaveFormat.JPEG });
  const size = new File(small.uri).size ?? 0;
  const base = (a.fileName ?? 'photo').replace(/\.[^.]+$/, '');
  return { uri: small.uri, name: `${base}.jpg`, size, type: 'image/jpeg' };
}

/** 파일 앱에서 PDF · 사진 · 텍스트 파일 한 개. 취소하면 null. */
export async function pickDocument(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*', 'text/plain'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets[0]) return null;
  const a = res.assets[0];
  const ext = extOf(a.name);
  return { uri: a.uri, name: a.name, size: a.size ?? new File(a.uri).size ?? 0, type: TYPES[ext] ?? a.mimeType ?? 'application/octet-stream' };
}

/** 고른 파일이 올릴 수 있는 것인지 — 안 되면 사용자에게 보여줄 말. */
export function checkFile(file: PickedFile, current: number): string | null {
  if (current >= MAX_FILES) return `파일은 ${MAX_FILES}개까지 붙일 수 있어요`;
  if (!Object.values(TYPES).includes(file.type)) return '사진 · PDF · 텍스트(.txt) 파일만 붙일 수 있어요';
  if (file.size > MAX_BYTES) return `파일 하나는 ${MAX_BYTES / 1024 / 1024}MB까지 붙일 수 있어요`;
  return null;
}

/** 저장소 경로에는 영문 · 숫자 · . _ - 만 써요(원래 이름은 attachments에 따로 남겨요). */
const safePart = (name: string) => name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-60) || 'file';

export type UploadResult = { ok: true; attachments: Attachment[] } | { ok: false; kind: 'offline' | 'other' };

/** `<내 id>/<문의 번호>/<순서>-<이름>`으로 올려요. 하나라도 실패하면 이미 올린 것도 지우고 실패로 돌려줘요. */
export async function uploadAttachments(userId: string, inquiryId: string, files: PickedFile[]): Promise<UploadResult> {
  const done: Attachment[] = [];
  const cleanup = () => supabase.storage.from(INQUIRY_BUCKET).remove(done.map((d) => d.path)).catch(() => {});
  for (let i = 0; i < files.length; i += 1) {
    const f = files[i];
    const path = `${userId}/${inquiryId}/${i + 1}-${safePart(f.name)}`;
    try {
      const bytes = await new File(f.uri).arrayBuffer();
      const { error } = await supabase.storage.from(INQUIRY_BUCKET).upload(path, bytes, { contentType: f.type, upsert: false });
      if (error) {
        await cleanup();
        return { ok: false, kind: /network|fetch|timeout|failed to|offline/i.test(error.message) ? 'offline' : 'other' };
      }
      done.push({ path, name: f.name, size: f.size, type: f.type });
    } catch (e) {
      await cleanup();
      return { ok: false, kind: /network|fetch|timeout|failed to|offline/i.test(e instanceof Error ? e.message : '') ? 'offline' : 'other' };
    }
  }
  return { ok: true, attachments: done };
}

/** 문의를 저장하지 못했을 때 이미 올린 파일을 지워요(실패해도 조용히 넘어가요). */
export async function removeAttachments(attachments: Attachment[]): Promise<void> {
  if (!attachments.length) return;
  await supabase.storage.from(INQUIRY_BUCKET).remove(attachments.map((a) => a.path)).catch(() => {});
}
